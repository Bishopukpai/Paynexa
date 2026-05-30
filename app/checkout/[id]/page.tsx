'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { usePostHog } from 'posthog-js/react' 
import { 
  useAccount, 
  useWriteContract, 
  useReadContract,
  useSwitchChain,
} from 'wagmi' 
import { parseUnits } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { getActiveConfig, GATEWAY_ABI, USDT_ABI } from "@/app/constants/contracts";

export default function CheckoutPage() {
  const { id } = useParams()
  const posthog = usePostHog() 
  const { address: userAddress, isConnected, chainId: currentWalletChainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  
  const [plan, setPlan] = useState<any>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccessComplete, setIsSuccessComplete] = useState(false)
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'active' | 'expired' | 'cancelled' | null>(null)
  const [expiryDate, setExpiryDate] = useState<string | null>(null)
  
  // Pipeline Stage Flags
  const [checkoutStep, setCheckoutStep] = useState<'idle' | 'approving' | 'paying' | 'saving'>('idle')

  // 🛠️ STRICT ENVIRONMENT RESOLUTION (No accidental fallbacks)
  const activeMode: 'production' | 'testnet' | null = 
    plan?.mode === 'production' ? 'production' : 
    plan?.mode === 'testnet' ? 'testnet' : null;

  // Safely extract configuration blocks only if a valid mode is matched
  const config = activeMode ? getActiveConfig(activeMode) : null;
  const GATEWAY_ADDRESS = config?.GATEWAY_ADDRESS;
  const USDT_ADDRESS = config?.USDT_ADDRESS;
  const CHAIN_ID = config?.CHAIN_ID;
  const TOKEN_DECIMALS = config?.TOKEN_DECIMALS || 6;

  // Contract Write Pipeline
  const { writeContractAsync: tokenApprove } = useWriteContract()
  const { writeContractAsync: payMerchantContract } = useWriteContract()
  
  // Read Balance
  const { data: usdtBalance } = useReadContract({
    address: USDT_ADDRESS,
    abi: [{
      "inputs": [{ "name": "account", "type": "address" }],
      "name": "balanceOf",
      "outputs": [{ "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: 'balanceOf',
    args: [userAddress || '0x0'],
    chainId: CHAIN_ID, 
    query: {
      enabled: !!USDT_ADDRESS && !!userAddress && !!CHAIN_ID
    }
  })

  // Fetch plan layout
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/plans?id=${id}`)
        const json = await res.json()
        if (json.success) {
          setPlan(json.data)
          // Explicitly throw warning if database data misses environment settings
          if (json.data && !['production', 'testnet'].includes(json.data.mode)) {
            setErrorMessage("Critical Error: Invalid or missing billing mode configuration in database.")
          }
        } else {
          setErrorMessage("Subscription plan configuration not found.")
        }
      } catch (err) {
        setErrorMessage("Failed to acquire payment channel data.")
      }
    }
    if (id) fetchPlan()
  }, [id])

  // Track page view
  useEffect(() => {
    if (id) posthog.capture('checkout_viewed', { planId: id })
  }, [id, posthog])

  // Verify DB Status
  useEffect(() => {
    const checkExistingSub = async () => {
      if (!userAddress || !id) return;
      try {
        const res = await fetch(`/api/subscriptions/check?address=${userAddress}&planId=${id}`)
        const json = await res.json()
        setSubStatus(json.status)
        setExpiryDate(json.expiryDate)
        if (json.active) setIsSuccessComplete(true)
      } catch (err) {
        console.error(err)
      } finally {
        setIsInitialLoading(false)
      }
    }
    if (isConnected && plan) checkExistingSub()
    else if (!isConnected) setIsInitialLoading(false)
  }, [userAddress, id, isConnected, plan])

  // Process subscription deployment
  const activateSubscription = useCallback(async (txHash: string) => {
    setCheckoutStep('saving')
    setErrorMessage(null)
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          userEmail: email,
          planId: id,
          transactionHash: txHash,
          currency: 'USDT'
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setIsSuccessComplete(true);
        setSubStatus('active');
        posthog.capture('payment_success', { planId: id, userAddress, userEmail: email, transactionHash: txHash })
      } else {
        setErrorMessage(result.error || "Failed to update database.");
      }
    } catch (err: any) {
      setErrorMessage("Network error: Could not reach backend server.");
    } finally {
      setCheckoutStep('idle')
    }
  }, [id, userAddress, email, posthog]);

  // THE ACTION PIPELINE
  const handlePayment = async () => {
    if (!plan || !userAddress || !activeMode || !CHAIN_ID || !USDT_ADDRESS || !GATEWAY_ADDRESS) {
      setErrorMessage("Missing critical contract architecture setup configuration.");
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    
    setErrorMessage(null);

    try {
      // 🔄 Phase 1: Chain Switch Protection
      if (currentWalletChainId !== CHAIN_ID) {
        setErrorMessage(`Switching wallet network context to appropriate ${activeMode} chain...`);
        await switchChainAsync({ chainId: CHAIN_ID });
      }

      const amount = parseUnits(plan.price.toString(), TOKEN_DECIMALS);

      if (usdtBalance !== undefined && (usdtBalance as bigint) < amount) {
        setErrorMessage(`Insufficient stablecoin balance to fulfill checkout configurations.`);
        return;
      }

      // 🔄 Phase 2: Sign ERC20 Spending Allowance
      setCheckoutStep('approving');
      await tokenApprove({
        chainId: CHAIN_ID, 
        address: USDT_ADDRESS,
        abi: USDT_ABI,
        functionName: 'approve',
        args: [GATEWAY_ADDRESS, amount],
      });

      // 🔄 Phase 3: Execute Final Gateway Payment immediately after approval signature
      setCheckoutStep('paying');
      const livePaymentHash = await payMerchantContract({
        chainId: CHAIN_ID,
        address: GATEWAY_ADDRESS,
        abi: GATEWAY_ABI,
        functionName: 'payMerchant',
        args: [
          USDT_ADDRESS,
          plan.businessAddress as `0x${string}`,
          amount
        ],
      });

      // 🔄 Phase 4: Sync to DB using the payment hash
      await activateSubscription(livePaymentHash);

    } catch (err: any) {
      console.error("Payment failure:", err);
      setCheckoutStep('idle');
      setErrorMessage(err.shortMessage || err.message || "Transaction rejected or canceled.");
    }
  }

  // Derive scannable UI state messages
  const isProcessing = checkoutStep !== 'idle';

  let displayStatusMessage = "";
  if (checkoutStep === 'approving') displayStatusMessage = "Signing token spending allowance...";
  else if (checkoutStep === 'paying') displayStatusMessage = "Processing secure merchant checkout...";
  else if (checkoutStep === 'saving') displayStatusMessage = "Activating subscription access...";

  if (!plan || isInitialLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-medium text-gray-500 text-sm">Verifying core contract channels...</p>
      </div>
    )
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 border border-gray-100 text-center relative overflow-hidden">
        
        {/* Environment Banner Indicator */}
        {activeMode ? (
          <div className={`absolute top-0 left-0 right-0 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors ${
            activeMode === 'production' ? 'bg-green-600' : 'bg-amber-500'
          }`}>
            {activeMode === 'production' ? '🚀 Production Mode (Base Mainnet)' : '🧪 Test Mode (Base Sepolia)'}
          </div>
        ) : (
          <div className="absolute top-0 left-0 right-0 py-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-red-600 animate-pulse">
            ⚠️ Invalid Environment Context
          </div>
        )}

        <div className="flex justify-center mb-6 mt-4">
          {plan?.logoUrl ? (
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-gray-100 flex items-center justify-center p-1 shadow-inner">
              <img src={plan.logoUrl} alt={`${plan.title} logo`} className="w-full h-full object-cover rounded-xl" />
            </div>
          ) : (
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-tr ${
              activeMode === 'production' ? 'from-green-500 to-emerald-600' : 'from-blue-500 to-indigo-600'
            }`}>
              <span className="text-white font-black text-3xl uppercase">{plan?.title?.charAt(0) || 'P'}</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-1">{plan.title}</h1>
        <p className="text-xl text-blue-600 font-extrabold mb-8 tracking-tight">
          {plan.price} USDT <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">/ {plan.interval}</span>
        </p>

        <div className="space-y-6">
          <div className="flex justify-center"><ConnectButton label="Connect Wallet" /></div>

          {subStatus && (
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-gray-100 text-left">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Status</p>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  subStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>{subStatus.toUpperCase()}</span>
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
            <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wide">Email for Notifications</label>
            <input 
              type="email" 
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 font-medium"
              required
            />
          </div>

          <button
            onClick={handlePayment}
            disabled={!isConnected || isProcessing || isSuccessComplete || !activeMode}
            className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all text-white
              ${isProcessing ? 'bg-orange-500 cursor-wait' : 
                isSuccessComplete ? 'bg-green-600' : 
                !activeMode ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-100'}`}
          >
            {isProcessing ? displayStatusMessage : isSuccessComplete ? 'Subscription Active ✓' : (subStatus === 'expired' ? 'Renew with USDT' : 'Pay with USDT')}
          </button>
          
          <div className="mt-4">
            {isSuccessComplete ? (
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100 text-center">
                <p className="text-green-700 font-bold text-sm">✓ Access Granted</p>
                <p className="text-green-600 text-xs mt-0.5">Your receipt has been dispatched to your email.</p>
              </div>
            ) : (
              !isProcessing && <p className="text-gray-400 text-xs font-medium">Stablecoin Payment Protected by Paynexa</p>
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