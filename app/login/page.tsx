'use client'

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // If already logged in, send them to the dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-10 text-center">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <span className="text-2xl font-bold text-white">P</span>
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
          Paynexa
        </h1>
        <p className="text-gray-500 mb-10 font-medium">
          Manage your crypto subscriptions and webhooks.
        </p>

        {/* Google Button */}
        <button
          onClick={() => signIn("google")}
          className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-[0.98] shadow-sm"
        >
          <img 
            src="https://authjs.dev/img/providers/google.svg" 
            alt="Google" 
            className="w-5 h-5" 
          />
          Continue with Google
        </button>

        <p className="mt-8 text-xs text-gray-400 px-6">
          By continuing, you agree to Paynexa's 
          <Link href="/terms" className="text-blue-600 hover:underline mx-1">Terms of Service</Link> 
          and 
          <Link href="/privacy" className="text-blue-600 hover:underline ml-1">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  )
}