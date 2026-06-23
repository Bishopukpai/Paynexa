'use client'

import { signIn, useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function LoginPage() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Form states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Feedback UI states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Check URL query parameters for verification or error states
  useEffect(() => {
    const verified = searchParams.get("verified")
    const error = searchParams.get("error")

    if (verified === "true") {
      setSuccessMessage("Email verified successfully! 🪐 You can now log in with your credentials.")
    }

    if (error) {
      if (error === "TokenExpiredOrInvalid") {
        setErrorMessage("The verification link has expired or is invalid. Please sign up again.")
      } else if (error === "InvalidToken") {
        setErrorMessage("Malformed verification token request.")
      } else {
        setErrorMessage("An unexpected authentication error occurred.")
      }
    }
  }, [searchParams])

  // Route back to dashboard if user authenticates
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email.toLowerCase().trim(),
        password,
      })

      if (result?.error) {
        // This catches the "Your email address has not been verified yet" error from NextAuth
        setErrorMessage(result.error)
      } else {
        router.push("/dashboard")
      }
    } catch (err: any) {
      setErrorMessage("System breakdown during verification check.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-10 relative overflow-hidden">
        
        {/* Header Block */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-2xl font-bold text-white">P</span>
            </div>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">
            Log in to manage your Paynexa gateway systems.
          </p>
        </div>

        {/* OAuth Anchor Entry */}
        <button
          onClick={() => signIn("google")}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-[0.98] shadow-sm text-sm"
        >
          <img 
            src="https://authjs.dev/img/providers/google.svg" 
            alt="Google" 
            className="w-4 h-4" 
          />
          Continue with Google
        </button>

        {/* Visual Separator Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-100"></div>
          <span className="px-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">Or credentials</span>
          <div className="flex-1 h-px bg-gray-100"></div>
        </div>

        {/* Main Credentials Form */}
        <form onSubmit={handleCredentialsLogin} className="space-y-4 text-left">
          
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wide">Email Address</label>
            <input 
              type="email"
              placeholder="merchant@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1.5 p-3.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-800"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wide">Password</label>
            <div className="relative mt-1.5">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 pr-14 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-800"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-blue-600 uppercase tracking-wider transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Error Banner Placement */}
          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 text-center animate-shake">
              {errorMessage}
            </div>
          )}

          {/* Success Banner Placement (Triggers when URL string contains ?verified=true) */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-100 text-center leading-relaxed shadow-sm">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-100 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {isSubmitting ? "Logging in..." : "Log in to Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          Don't have an account? <Link href="/signup" className="text-blue-600 font-bold hover:underline">Sign up</Link>
        </div>
      </div>
    </main>
  )
}