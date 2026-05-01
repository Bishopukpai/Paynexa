'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  
  // State updated for USDT and Webhook tracking
  const [formData, setFormData] = useState({ 
    title: '', 
    price: '', 
    interval: 'monthly',
    webhookUrl: '' 
  })
  
  const [loading, setLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')

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
        // Sending data with currency explicit for the backend
        body: JSON.stringify({ 
          ...formData, 
          businessAddress: address,
          currency: 'USDT' 
        }),
      })
      
      if (res.ok) {
        const result = await res.json();
        const planId = result.data._id;
        // Generate the checkout link for the merchant to share
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

  return (
    <main className="min-h-dvh w-full flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 p-10">
        
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-6 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-xl font-bold text-white">P</span>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create USDT Plan</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium"> Set up your stablecoin subscription tier </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Plan Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Plan Name</label>
            <input 
              required
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" 
              placeholder="e.g. Premium SaaS Access" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          {/* Pricing in USDT */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Pricing (USDT)</label>
            <div className="relative">
              <input 
                required
                type="number"
                step="0.01"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm pl-10" 
                placeholder="29.99" 
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
            </div>
          </div>

          {/* Billing Cycle */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Billing Cycle</label>
            <select 
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm appearance-none cursor-pointer"
              value={formData.interval}
              onChange={e => setFormData({...formData, interval: e.target.value})}
            >
              <option value="hourly">Hourly (Dev Testing)</option>
              <option value="daily">Daily Billing</option>
              <option value="monthly">Monthly Billing</option>
              <option value="yearly">Yearly Billing</option>
            </select>
          </div>

          {/* Webhook URL */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Webhook Notification URL</label>
            <input 
              required
              type="url"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" 
              placeholder="https://your-api.com/webhooks/paynexa" 
              value={formData.webhookUrl}
              onChange={e => setFormData({...formData, webhookUrl: e.target.value})}
            />
            <p className="text-[9px] text-gray-400 ml-1 italic">We'll send a POST request here when a customer pays.</p>
          </div>

          <button 
            type="submit"
            disabled={!canDeploy}
            className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg mt-2 text-white
              ${canDeploy 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 cursor-pointer' 
                : 'bg-gray-300 cursor-not-allowed shadow-none'
              }`}
          >
            {loading ? 'Processing...' : 'Deploy USDT Plan'}
          </button>

          {generatedLink && (
            <div className="mt-6 p-4 bg-green-50 rounded-2xl border border-green-100 animate-in fade-in zoom-in duration-300">
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2">
                Live Checkout Link
              </p>
              <div className="flex items-center gap-2">
                <input 
                  readOnly 
                  value={generatedLink}
                  className="flex-1 bg-white p-2 text-xs font-mono border rounded-lg text-gray-600 outline-none"
                />
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    alert("Link copied!");
                  }}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Merchant Wallet</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${address ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-[10px] font-mono text-gray-500">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
                </span>
              </div>
            </div>
        </div>
      </div>
    </main>
  )
}