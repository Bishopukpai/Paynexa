'use client'

import { useSession, signOut } from 'next-auth/react'
import { useAccount, useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function MerchantDashboard() {
  const { data: session, status, update } = useSession()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [data, setData] = useState({
    stats: { active: 0, inactive: 0, failed: 0, revenue: 0 },
    plans: [],
    customers: []
  })
  const [loading, setLoading] = useState(true)

  // Profile Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Check if the user is an affiliate (checks boolean or string role property on session)
  const isAffiliate = Boolean(
    (session?.user as any)?.isAffiliate || (session?.user as any)?.role === 'affiliate'
  )

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Hydrate settings fields configuration states when session parameters resolve
  useEffect(() => {
    if (session?.user) {
      setEditName(session.user.name || "")
      setPreviewUrl(session.user.image || null)
      setCurrentAvatarUrl(session.user.image || null)
    }
  }, [session])

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

  // Logout Handler (Disconnects Wallet + Signs out NextAuth Session)
  const handleLogout = async () => {
    if (disconnect) {
      disconnect()
    }
    await signOut({ callbackUrl: '/login' })
  }

  // Process selected files out of system explorer and construct memory object preview streams
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        setModalError("Please select a valid image file configuration asset.")
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  // Profile Form Saver Method utilizing direct frontend Supabase Storage uploads
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)
    setIsSavingProfile(true)

    try {
      let finalImageUrl = currentAvatarUrl

      if (selectedFile) {
        const fileExtension = selectedFile.name.split('.').pop()
        const customFilename = `merchant-${Date.now()}.${fileExtension}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(customFilename, selectedFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(customFilename)

        finalImageUrl = publicUrl
      }

      const res = await fetch('/api/merchant/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: editName, 
          imageUrl: finalImageUrl 
        }),
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || "Profile update failed.")

      const updatedImage = result.user?.image || finalImageUrl

      setCurrentAvatarUrl(updatedImage)

      await update({
        user: {
          name: editName,
          image: updatedImage
        }
      })

      setIsModalOpen(false)
      setSelectedFile(null)
      
      router.refresh()
    } catch (err: any) {
      setModalError(err.message || "Something went wrong.")
    } finally {
      setIsSavingProfile(false)
    }
  }

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-gray-900 animate-pulse">Loading Paynexa Dashboard...</p>
      </div>
    )
  }

  if (!session) return null

  const getInitial = () => {
    return session.user?.name ? session.user.name.charAt(0).toUpperCase() : "M"
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">Paynexa</span>
          </Link>

          <div 
            onClick={() => setIsModalOpen(true)}
            className="hidden lg:flex items-center gap-3 border-l border-gray-100 pl-10 cursor-pointer hover:opacity-80 transition-opacity group"
          >
            {currentAvatarUrl ? (
              <img 
                src={currentAvatarUrl} 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-50"
                alt="Profile"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-blue-50">
                {getInitial()}
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Edit Profile ⚙️</p>
              <p className="text-sm font-bold text-gray-900">Hello, {session.user?.name?.split(' ')[0]}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Conditional Affiliate Dashboard Navigation Link */}
          {isAffiliate && (
            <Link 
              href="/affiliate/dashboard" 
              className="hidden sm:flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-emerald-200/60"
            >
              <span>🤝</span> Affiliate Portal
            </Link>
          )}

          {isConnected && (
            <Link 
              href="/create-plan" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-gray-200"
            >
              + Create Plan
            </Link>
          )}
          <ConnectButton accountStatus="address" showBalance={false} chainStatus="none" />
          
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            title="Log out of account"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Business Overview</h1>
            <p className="text-gray-500 mt-2 text-lg">Manage your crypto subscriptions and revenue.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="lg:hidden text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-all"
          >
            ⚙️ Edit Profile
          </button>
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
                <div key={plan._id} className="bg-white p-7 rounded-4xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
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
              <div className="col-span-full bg-white border-2 border-dashed border-gray-200 rounded-4xl py-12 flex flex-col items-center">
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
                        ${(Number(sub.planId?.price || 0) * 0.985).toFixed(2)}
                        <span className="block text-[9px] text-blue-500 font-normal uppercase tracking-tighter">Net after fee</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-4xl flex items-center justify-center text-3xl mb-4">📂</div>
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

      {/* --- SETTINGS EDIT PROFILE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 relative animate-scaleUp">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Merchant Settings</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 font-bold transition-all text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5 text-left">
              
              {/* Profile Image Preview UI Block */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl mb-2">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md bg-white"
                    alt="Preview"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md border-4 border-white">
                    {editName ? editName.charAt(0).toUpperCase() : "M"}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Avatar Image Status</h4>
                  <p className="text-[11px] text-gray-400 font-medium">Ready to sync changes down to database cloud clusters.</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wide">Merchant Brand Name</label>
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full mt-1.5 p-3.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-800"
                  required
                />
              </div>

              {/* DYNAMIC FILE CHANGER BLOCK WRAPPER */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wide">Upload Avatar Photo</label>
                <input 
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-1.5 p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-500 font-semibold text-xs text-center hover:bg-gray-100 hover:border-gray-300 transition-all uppercase tracking-wide block"
                >
                  {selectedFile ? `Selected: ${selectedFile.name.slice(0, 20)}...` : "📁 Choose Image File from Computer"}
                </button>
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium text-center">
                  {modalError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-100 disabled:bg-gray-200"
                >
                  {isSavingProfile ? "Uploading..." : "Save Changes"}
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Sign Out of Paynexa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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