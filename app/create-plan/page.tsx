'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function CreatePlan() {
  const { address, isConnected } = useAccount()
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State for USDT and Webhook tracking
  const [formData, setFormData] = useState({ 
    title: '', 
    price: '', 
    interval: 'monthly',
    webhookUrl: '' 
  })
  
  const [loading, setLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')

  // 1. PROTECTION: Redirect to login if Google session is missing
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Validation Logic
  const isFormValid = 
    formData.title.trim() !== '' && 
    Number(formData.price) > 0 && 
    formData.webhookUrl.trim().startsWith('http');

  const canDeploy = isFormValid && isConnected && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canDeploy) return; 
    
    setLoading(true)
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          businessAddress: address,
          currency: 'USDT' 
        }),
      })
      
      if (res.ok) {
        const result = await res.json();
        const planId = result.data._id;
        const link = `${window.location.origin}/checkout/${planId}`;
        setGeneratedLink(link);
        // Optional: Reset form after success
        // setFormData({ title: '', price: '', interval: 'monthly', webhookUrl: '' });
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || "Failed to create plan"}`);
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred while deploying the plan.");
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Verifying Session...</p>
      </div>
    )
  }

  // If not authenticated, the useEffect handles the redirect, so we return null here
  if (!session) return null

  const platformAddress = process.env.NEXT_PUBLIC_PLATFORM_FEE_ADDRESS;

  return (
    <main className="min-h-dvh w-full flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 p-10 relative overflow-hidden">
        
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />

        <div className="text-center mb-8 relative">
          <Link href="/dashboard" className="inline-flex items-center justify-center mb-6 hover:scale-110 transition-transform">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-xl font-bold text-white">P</span>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create USDT Plan</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Set up your stablecoin subscription tier</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Plan Name</label>
            <input 
              required
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium" 
              placeholder="e.g. Premium SaaS Access" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Pricing (USDT)</label>
            <div className="relative">
              <input 
                required
                type="number"
                step="0.01"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm pl-10 font-bold" 
                placeholder="29.99" 
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Billing Cycle</label>
            <div className="relative">
              <select 
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm appearance-none cursor-pointer font-medium"
                value={formData.interval}
                onChange={e => setFormData({...formData, interval: e.target.value})}
              >
                <option value="hourly">Hourly (Dev Testing)</option>
                <option value="daily">Daily Billing</option>
                <option value="monthly">Monthly Billing</option>
                <option value="yearly">Yearly Billing</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Webhook Notification URL</label>
            <input 
              required
              type="url"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium" 
              placeholder="https://your-api.com/webhooks" 
              value={formData.webhookUrl}
              onChange={e => setFormData({...formData, webhookUrl: e.target.value})}
            />
          </div>

          {Number(formData.price) > 0 && (
  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 mb-6">
    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
      <span>Payment Breakdown</span>
    </div>
    
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Customer pays:</span>
        <span className="font-bold text-gray-900">${formData.price} USDT</span>
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Platform fee (1.5%):</span>
        <span className="font-bold text-red-500">-${(Number(formData.price) * 0.015).toFixed(2)} USDT</span>
      </div>
      
      <div className="pt-2 border-t border-blue-100 flex justify-between">
        <span className="font-bold text-blue-600">Your net earnings:</span>
        <span className="font-black text-blue-600 text-lg">
          ${(Number(formData.price) * 0.985).toFixed(2)} USDT
        </span>
      </div>
    </div>
  </div>
)}

          <button 
            type="submit"
            disabled={!canDeploy}
            className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg mt-2 text-white
              ${canDeploy 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 cursor-pointer' 
                : 'bg-gray-300 cursor-not-allowed shadow-none'
              }`}
          >
            {loading ? 'Deploying to Chain...' : 'Deploy USDT Plan'}
          </button>

          {generatedLink && (
            <div className="mt-6 p-4 bg-green-50 rounded-2xl border border-green-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2">
                Live Checkout Link Generated!
              </p>
              <div className="flex items-center gap-2">
                <input 
                  readOnly 
                  value={generatedLink}
                  className="flex-1 bg-white p-2.5 text-[11px] font-mono border border-green-200 rounded-lg text-gray-600 outline-none"
                />
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    alert("Copied to clipboard!");
                  }}
                  className="p-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer info stays inside the card */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Merchant Wallet</span>
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            <div className={`w-1.5 h-1.5 rounded-full ${address ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-mono text-gray-500 font-bold">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}