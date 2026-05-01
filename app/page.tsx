'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
  setMounted(true)
}, [])

// Separate effect for the database call
useEffect(() => {
  const registerBusiness = async () => {
    if (isConnected && address) {
      console.log("Attempting to register wallet:", address); // Log to browser
      try {
        const response = await fetch('/api/business', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: address }),
        });
        const data = await response.json();
        console.log("Server Response:", data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    }
  };

  registerBusiness();
}, [isConnected, address]); 

  if (!mounted) return null

  return (
    /* h-screen + items-center + justify-center handles the centering */
    <main className="min-h-dvh w-full flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-4xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-10 transform transition-all">
        
        {/* Logo Section */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center mb-6 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-xl font-bold text-white">P</span>
            </div>
          </Link>
          
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Paynexa
          </h1>
          <p className="text-gray-500 mt-3 text-sm font-medium">
            {isConnected 
              ? "Authentication successful" 
              : "Connect your wallet to manage your Web3 subscriptions"}
          </p>
        </div>

        {/* Action Section */}
        <div className="flex flex-col items-center gap-8">
          <div className="w-full flex justify-center scale-110">
            {/* RainbowKit Button */}
            <ConnectButton 
              label="Connect Wallet"
              showBalance={false}
              chainStatus="icon"
              accountStatus="address"
            />
          </div>

          {isConnected && (
            <div className="w-full space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Wallet Connected
                  </span>
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                </div>
                <p className="text-[13px] font-mono text-gray-600 break-all leading-relaxed">
                  {address}
                </p>
              </div>
              
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-[0.98]"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-10 pt-8 border-t border-gray-100 text-center">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            End-to-End Encrypted
          </p>
        </div>
      </div>
    </main>
  )
}