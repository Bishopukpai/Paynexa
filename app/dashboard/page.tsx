'use client'

import { useSession } from 'next-auth/react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MerchantDashboard() {
  const { data: session, status } = useSession()
  const { address, isConnected } = useAccount()
  const router = useRouter()
  
  const [data, setData] = useState({
    stats: { active: 0, inactive: 0, failed: 0, revenue: 0 },
    plans: [],
    customers: []
  })
  const [loading, setLoading] = useState(true)

  // 1. PROTECTION: Redirect if not logged in via Google
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // 2. DATA FETCHING: Get stats when wallet is connected
  useEffect(() => {
    const fetchStats = async () => {
      if (isConnected && address) {
        try {
          const res = await fetch(`/api/merchant/stats?address=${address}`)
          const json = await res.json()
          if (json.success) {
            setData(json)
          }
        } catch (err) {
          console.error("Dashboard fetch error:", err)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchStats()
    }
  }, [isConnected, address, status])

  // Show loading spinner while checking session
  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-gray-900 animate-pulse">Loading Paynexa Dashboard...</p>
      </div>
    )
  }

  // Prevent flash of content
  if (!session) return null

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      {/* --- NAVIGATION BAR --- */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">Paynexa</span>
          </Link>

          <div className="hidden lg:flex items-center gap-3 border-l border-gray-100 pl-10">
            <img 
              src={session.user?.image || ''} 
              className="w-9 h-9 rounded-full ring-2 ring-blue-50"
              alt="Profile"
            />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Merchant</p>
              <p className="text-sm font-bold text-gray-900">Hello, {session.user?.name?.split(' ')[0]}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isConnected && (
            <Link 
              href="/create-plan" 
              className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-gray-200"
            >
              + Create Plan
            </Link>
          )}
          <ConnectButton accountStatus="address" showBalance={false} chainStatus="none" />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Business Overview</h1>
          <p className="text-gray-500 mt-2 text-lg">Manage your crypto subscriptions and revenue.</p>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Monthly Revenue" value={`$${data.stats.revenue.toFixed(2)}`} icon="💰" />
          <StatCard title="Active Subs" value={data.stats.active} icon="💎" />
          <StatCard title="Inactive" value={data.stats.inactive} icon="⌛" />
          <StatCard title="Failed" value={data.stats.failed} icon="⚠️" />
        </div>

        {/* --- PLANS SECTION --- */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Subscription Plans</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.plans.length > 0 ? (
              data.plans.map((plan: any) => (
                <div key={plan._id} className="bg-white p-7 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-md transition-all">
                  <h3 className="font-bold text-lg text-gray-900">{plan.title}</h3>
                  <p className="text-3xl font-black text-blue-600 mt-2">
                    ${plan.price} <span className="text-xs text-gray-400 font-bold uppercase tracking-tighter">/ {plan.interval}</span>
                  </p>
                  <div className="mt-6 flex gap-2">
                    <button className="flex-1 text-[11px] font-bold uppercase bg-gray-50 text-gray-600 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">Edit</button>
                    <Link 
                      href={`/checkout/${plan._id}`} 
                      className="flex-1 text-center text-[11px] font-bold uppercase bg-blue-50 text-blue-600 py-2.5 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      Payment Link
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white border-2 border-dashed border-gray-200 rounded-[2rem] py-12 flex flex-col items-center">
                <p className="text-gray-400 font-medium">You haven't created any plans yet.</p>
                <Link href="/create-plan" className="mt-3 text-blue-600 font-bold text-sm">Create your first plan &rarr;</Link>
              </div>
            )}
          </div>
        </div>

        {/* --- CUSTOMER TABLE --- */}
        <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Recent Customers</h2>
            <button className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest">Export CSV</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">Customer Info</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Plan</th>
                  <th className="px-8 py-5 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.customers.length > 0 ? (
                  data.customers.map((sub: any) => (
                    <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{sub.userEmail}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{sub.userAddress}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-gray-600 font-medium">
                        {sub.planId?.title || 'Unknown Plan'}
                      </td>
                      <td className="px-8 py-5 text-right font-black text-gray-900">
                        ${sub.planId?.price || '0.00'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-3xl mb-4">📂</div>
                        <h3 className="text-lg font-bold text-gray-900">No active customers yet</h3>
                        <p className="text-gray-400 text-sm mt-1">Once users subscribe, they will appear here.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
      <div className="text-2xl mb-4">{icon}</div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
    </div>
  )
}