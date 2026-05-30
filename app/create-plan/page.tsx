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
  
  // 🎛️ Mode switch state: 'testnet' defaults merchants safely out of live environments
  const [billingMode, setBillingMode] = useState<'testnet' | 'production'>('testnet')
  
  // State for USDT, Webhook, and File Tracking
  const [formData, setFormData] = useState({ 
    title: '', 
    price: '', 
    interval: 'monthly',
    webhookUrl: '' 
  })
  
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')

  // Redirect to login if Google session is missing
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Cleanup object URL preview to avoid browser memory leaks
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  // Validation Logic
  const isFormValid = 
    formData.title.trim() !== '' && 
    Number(formData.price) > 0 && 
    formData.webhookUrl.trim().startsWith('http');

  const canDeploy = isFormValid && isConnected && !loading;

  // Handle Logo Input Changes
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      
      // Generate a client-side preview URL
      if (logoPreview) URL.revokeObjectURL(logoPreview)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canDeploy) return; 
    
    setLoading(true)
    try {
      // Use FormData to allow combined text and file payload transfers
      const submitData = new FormData()
      submitData.append('title', formData.title)
      submitData.append('price', formData.price)
      submitData.append('interval', formData.interval)
      submitData.append('webhookUrl', formData.webhookUrl)
      submitData.append('businessAddress', address as string)
      submitData.append('currency', 'USDT')
      submitData.append('mode', billingMode) // 🚀 Injected: Sends 'testnet' or 'production' configuration directly to backend mongo/postgres models
      
      if (logoFile) {
        submitData.append('logo', logoFile)
      }

      const res = await fetch('/api/plans', {
        method: 'POST',
        // Note: Headers must NOT specify Content-Type; the browser auto-appends boundary tokens for FormData
        body: submitData,
      })
      
      if (res.ok) {
        const result = await res.json();
        const planId = result.data._id;
        const link = `${window.location.origin}/checkout/${planId}`;
        setGeneratedLink(link);
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

  if (!session) return null

  return (
    <main className="min-h-dvh w-full flex items-center justify-center bg-slate-50 px-4 py-12 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 p-10 relative overflow-hidden">
        
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

        {/* 🎛️ REUSABLE WORKSPACE TOGGLE (TEST ENVIRONMENT CONTROL DEPLOYED HERE) */}
        <div className="mb-6 bg-gray-100 p-1 rounded-2xl flex items-center gap-1 border border-gray-200 relative z-10">
          <button
            type="button"
            onClick={() => setBillingMode('testnet')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
              billingMode === 'testnet' 
                ? 'bg-amber-500 text-white shadow-md shadow-amber-100' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            🧪 Test Mode (Sepolia)
          </button>
          <button
            type="button"
            onClick={() => setBillingMode('production')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
              billingMode === 'production' 
                ? 'bg-green-600 text-white shadow-md shadow-green-100' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            🚀 Live Mode (Mainnet)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          
          {/* LOGO UPLOAD COMPONENT BLOCK */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Brand Logo (Optional)</label>
            <div className="flex items-center gap-4 bg-gray-50 p-4 border border-gray-200 rounded-2xl transition-all">
              <div className="relative w-14 h-14 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 text-left">
                <label htmlFor="logo-file" className="inline-block bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer transition-all shadow-sm">
                  Choose Image
                </label>
                <input 
                  id="logo-file"
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  onChange={handleLogoChange}
                />
                <p className="text-[10px] text-gray-400 mt-1 font-medium">Square PNG or JPEG max 2MB</p>
              </div>
            </div>
          </div>

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
                ? billingMode === 'production' 
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-100 cursor-pointer' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed shadow-none'
              }`}
          >
            {loading 
              ? 'Deploying to Chain...' 
              : billingMode === 'production' 
                ? 'Deploy Live USDT Plan' 
                : 'Deploy Test USDT Plan'
            }
          </button>

          {generatedLink && (
            <div className="mt-6 p-4 bg-green-50 rounded-2xl border border-green-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2">
                {billingMode === 'production' ? '🚀 Live Checkout Link Generated!' : '🧪 Test Checkout Link Generated!'}
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