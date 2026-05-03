'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { 
  useAccount, 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  usePublicClient,
  useReadContract
} from 'wagmi' 
import { sepolia } from 'wagmi/chains' 
import { parseUnits } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
// Import the new constants we created
import { GATEWAY_ADDRESS, GATEWAY_ABI, USDT_ADDRESS, USDT_ABI } from "@/app/constants/contracts";

export default function CheckoutPage() {
  const { id } = useParams()
  const { address: userAddress, isConnected } = useAccount()
  
  const [plan, setPlan] = useState<any>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isDatabaseUpdating, setIsDatabaseUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccessComplete, setIsSuccessComplete] = useState(false)
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'active' | 'expired' | 'cancelled' | null>(null)
  const [expiryDate, setExpiryDate] = useState<string | null>(null)
  const publicClient = usePublicClient();

  // Use writeContractAsync so we can await Step 1 before Step 2
  const { data: hash, writeContractAsync, isPending: isWalletPending } = useWriteContract()
  const { data: usdtBalance } = useReadContract({
  address: USDT_ADDRESS,
  abi: [
    {
      "inputs": [{ "name": "account", "type": "address" }],
      "name": "balanceOf",
      "outputs": [{ "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  functionName: 'balanceOf',
  args: [userAddress || '0x0'],
})

  const { 
    status: txStatus, 
    isLoading: isConfirming, 
    isSuccess: isTxSuccess,
    error: confirmError 
  } = useWaitForTransactionReceipt({
    hash,
    chainId: sepolia.id, 
  })

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/plans?id=${id}`)
        const json = await res.json()
        if (json.success) setPlan(json.data)
      } catch (err) {
        console.error("Error fetching plan:", err)
      }
    }
    if (id) fetchPlan()
  }, [id])

  useEffect(() => {
    const checkExistingSub = async () => {
      if (!userAddress || !id) return;
      try {
        const res = await fetch(`/api/subscriptions/check?address=${userAddress}&planId=${id}`)
        const json = await res.json()
        setSubStatus(json.status)
        setExpiryDate(json.expiryDate)
        if (json.active) {
          setIsSuccessComplete(true)
        }
      } catch (err) {
        console.error("Initial check error:", err)
      } finally {
        setIsInitialLoading(false)
      }
    }

    if (isConnected) checkExistingSub()
    else setIsInitialLoading(false)
  }, [userAddress, id, isConnected])

  const activateSubscription = useCallback(async (currentHash: string) => {
    if (isDatabaseUpdating || isSuccessComplete) return;
    setIsDatabaseUpdating(true)
    setErrorMessage(null)
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          userEmail: email,
          planId: id,
          transactionHash: currentHash,
          currency: 'USDT'
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setIsSuccessComplete(true);
        setSubStatus('active');
      } else {
        setErrorMessage(result.error || "Failed to update database.");
      }
    } catch (err) {
      setErrorMessage("Network error: Could not reach the server.");
    } finally {
      setIsDatabaseUpdating(false)
    }
  }, [id, userAddress, email, isDatabaseUpdating, isSuccessComplete]);

  useEffect(() => {
    if ((txStatus === 'success' || isTxSuccess) && hash && userAddress && !isSuccessComplete) {
      activateSubscription(hash);
    }
    if (confirmError) {
      setErrorMessage("Blockchain confirmation failed. Please check your wallet.");
    }
  }, [txStatus, isTxSuccess, hash, userAddress, activateSubscription, isSuccessComplete, confirmError]);

  // --- UPDATED HANDLER: SPLIT PAYMENT LOGIC ---
  // Inside your CheckoutPage component...

const handlePayment = async () => {
  if (!plan || !userAddress) return;
  
  if (!email || !email.includes('@')) {
    setErrorMessage("Please enter a valid email address.");
    return;
  }
  
  setErrorMessage(null);
  
  try {
    const amount = parseUnits(plan.price.toString(), 6);

    // --- NEW: PRE-FLIGHT BALANCE CHECK ---
    if (usdtBalance !== undefined && usdtBalance < amount) {
      setErrorMessage(`Insufficient USDT balance. You need ${plan.price} USDT but have ${(Number(usdtBalance) / 1_000_000).toFixed(2)}.`);
      return; // Stop the execution here!
    }

    // --- STEP 1: APPROVE ---
    setErrorMessage("Requesting USDT approval...");
    const approveHash = await writeContractAsync({
      address: USDT_ADDRESS,
      abi: USDT_ABI,
      functionName: 'approve',
      args: [GATEWAY_ADDRESS, amount],
    });

    setErrorMessage("Confirming approval on-chain...");
    await publicClient?.waitForTransactionReceipt({ hash: approveHash });

    // --- STEP 2: EXECUTE PAYMENT ---
    setErrorMessage("Approval confirmed! Please sign the payment.");
    await writeContractAsync({
      address: GATEWAY_ADDRESS,
      abi: GATEWAY_ABI,
      functionName: 'payMerchant',
      args: [
        USDT_ADDRESS,
        plan.businessAddress as `0x${string}`,
        amount
      ],
    });

  } catch (err: any) {
    console.error("Payment flow error:", err);
    // This catches rejections or unexpected gas errors
    setErrorMessage(err.shortMessage || "Transaction failed or rejected.");
  }
}
  const isProcessing = isWalletPending || isConfirming || isDatabaseUpdating;

  if (isInitialLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="animate-pulse font-medium text-gray-500 text-sm">Verifying subscription status...</p>
      </div>
    )
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 border border-gray-100 text-center">
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          {plan ? plan.title : 'Loading Plan...'}
        </h1>
        <p className="text-gray-500 mb-8 font-bold">
          {plan ? `${plan.price} USDT / ${plan.interval}` : '---'}
        </p>

        <div className="space-y-6">
          <div className="flex justify-center">
            <ConnectButton label="Connect Wallet" />
          </div>

          {subStatus && (
            <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Account Status</p>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                  subStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {subStatus.toUpperCase()}
                </span>
              </div>
              {expiryDate && (
                <p className="text-sm font-semibold text-gray-700 mt-2">
                  {subStatus === 'active' ? 'Valid until: ' : 'Expired on: '}
                  <span className="text-gray-900">{new Date(expiryDate).toLocaleDateString()}</span>
                </p>
              )}
            </div>
          )}

          <div className="text-left space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email for Notifications</label>
            <input 
              type="email" 
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>

          <button
            onClick={handlePayment}
            disabled={!isConnected || isProcessing || isSuccessComplete}
            className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all text-white
              ${isProcessing ? 'bg-orange-500 cursor-wait' : 
                isSuccessComplete ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isWalletPending && 'Confirm in Wallet...'}
            {isConfirming && 'Verifying USDT...'}
            {isDatabaseUpdating && 'Finalizing Account...'}
            {isSuccessComplete && 'Subscription Active ✓'}
            {!isProcessing && !isSuccessComplete && (subStatus === 'expired' ? 'Renew with USDT' : 'Pay with USDT')}
          </button>
          
          <div className="mt-4">
            {isSuccessComplete ? (
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                <p className="text-green-700 font-bold text-sm">✓ Access Granted</p>
                <p className="text-green-600 text-xs">Your USDT payment was successful.</p>
              </div>
            ) : (
              !isProcessing && (
                <p className="text-gray-400 text-xs font-medium">
                  {subStatus === 'expired' ? 'Your access has expired. Please renew.' : 'Stablecoin Payment Protected by Paynexa'}
                </p>
              )
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}