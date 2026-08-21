"use client"

import { usePrivy, useLogin, User } from "@privy-io/react-auth"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)

  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null
  }

  return null
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { authenticated, user, ready } = usePrivy()

  const [refCode, setRefCode] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [passwordFeedback, setPasswordFeedback] = useState({
    score: 0,
    label: "Empty",
    color: "bg-gray-200",
  })

  // ===========================================================================
  // REFERRAL CODE
  // ===========================================================================

  useEffect(() => {
    const queryRef = searchParams.get("ref")
    const cookieRef = getCookie("paynexa_ref")
    const activeRef = queryRef || cookieRef

    if (activeRef) {
      setRefCode(activeRef.trim().toUpperCase())
    }
  }, [searchParams])

  // ===========================================================================
  // PRIVY SOCIAL AUTHENTICATION
  // ===========================================================================

  const handlePrivySync = async (privyUser: User | null) => {
    if (!privyUser) return

    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const userEmail =
        privyUser?.email?.address ||
        privyUser?.google?.email ||
        privyUser?.apple?.email

      const res = await fetch("/api/auth/privy-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          privyId: privyUser?.id,
          email: userEmail,
          referredBy: refCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error || "Social authentication sync failed."
        )
      }

      // Privy authentication is already established.
      // Send the user directly to the dashboard.
      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to finalize social registration."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const { login } = useLogin({
    onComplete: ({ user }) => {
      handlePrivySync(user)
    },
    onError: (error) => {
      console.error("Privy login cancelled or errored:", error)
    },
  })

  // ===========================================================================
  // HANDLE EXISTING PRIVY AUTHENTICATION
  // ===========================================================================

  useEffect(() => {
    if (ready && authenticated && user) {
      handlePrivySync(user)
    }
  }, [ready, authenticated, user])

  // ===========================================================================
  // PASSWORD STRENGTH
  // ===========================================================================

  useEffect(() => {
    if (!password) {
      setPasswordFeedback({
        score: 0,
        label: "Empty",
        color: "bg-gray-200",
      })
      return
    }

    let score = 0

    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (password.length < 6) {
      setPasswordFeedback({
        score: 1,
        label: "Weak (Too Short)",
        color: "bg-red-500",
      })
    } else if (score <= 1) {
      setPasswordFeedback({
        score: 1,
        label: "Weak",
        color: "bg-red-500",
      })
    } else if (score === 2) {
      setPasswordFeedback({
        score: 2,
        label: "Fair",
        color: "bg-orange-400",
      })
    } else if (score === 3) {
      setPasswordFeedback({
        score: 3,
        label: "Good",
        color: "bg-blue-500",
      })
    } else if (score === 4) {
      setPasswordFeedback({
        score: 4,
        label: "Strong",
        color: "bg-green-500",
      })
    }
  }, [password])

  // ===========================================================================
  // CREDENTIALS SIGNUP
  // ===========================================================================
  //
  // Flow:
  //
  // 1. Create account through /api/auth/signup
  // 2. Account is created with isVerified: true
  // 3. Automatically sign in using NextAuth credentials
  // 4. NextAuth creates the JWT session
  // 5. Redirect to /dashboard
  //
  // ===========================================================================

  const handleCredentialsSignup = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    setErrorMessage(null)
    setSuccessMessage(null)

    // -------------------------------------------------------------------------
    // Validate passwords
    // -------------------------------------------------------------------------

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    if (passwordFeedback.score < 2) {
      setErrorMessage("Please choose a stronger password.")
      return
    }

    setIsSubmitting(true)

    try {
      // -----------------------------------------------------------------------
      // STEP 1: CREATE THE ACCOUNT
      // -----------------------------------------------------------------------

      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName,
          email,
          password,
          referredBy: refCode,
        }),
      })

      const signupData = await signupRes.json()

      if (!signupRes.ok) {
        throw new Error(
          signupData.error ||
            "Something went wrong during registration."
        )
      }

      // -----------------------------------------------------------------------
      // STEP 2: AUTOMATICALLY LOG THE USER IN
      // -----------------------------------------------------------------------
      //
      // Your NextAuth credentials provider will:
      //
      // - Find the newly created Business
      // - Compare the password with bcrypt
      // - Confirm isVerified === true
      // - Return the user
      // - Create the JWT session
      //
      // -----------------------------------------------------------------------

      const loginResult = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      })

      if (!loginResult) {
        throw new Error(
          "Account created successfully, but automatic login could not be completed."
        )
      }

      if (loginResult.error) {
        console.error(
          "Automatic credentials login failed:",
          loginResult.error
        )

        throw new Error(
          "Account created successfully, but automatic login failed. Please log in manually."
        )
      }

      // -----------------------------------------------------------------------
      // STEP 3: REDIRECT TO DASHBOARD
      // -----------------------------------------------------------------------

      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      console.error("Credentials signup error:", err)

      setErrorMessage(
        err.message || "Failed to create account."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ===========================================================================
  // UI
  // ===========================================================================

  return (
    <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-10 relative overflow-hidden">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <span className="text-2xl font-bold text-white">
              P
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Create your Account
        </h1>

        <p className="text-gray-400 text-sm font-medium mt-1">
          Get started with Paynexa gateway systems.
        </p>
      </div>

      {/* Referral Code */}
      {refCode && (
        <div className="mb-6 flex items-center justify-between bg-blue-50/80 border border-blue-100 px-4 py-2.5 rounded-2xl text-xs">
          <span className="text-blue-800 font-medium">
            Referred by:{" "}
            <strong className="font-bold text-blue-900">
              {refCode}
            </strong>
          </span>

          <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full tracking-wider uppercase">
            Applied ✓
          </span>
        </div>
      )}

      {/* Privy / Social Signup */}
      <button
        type="button"
        onClick={() => login()}
        disabled={isSubmitting || !ready}
        className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold transition-all active:scale-[0.98] shadow-md text-sm mb-3 disabled:opacity-50"
      >
        Continue with Social / Privy
      </button>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-gray-100" />

        <span className="px-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
          Or credentials
        </span>

        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Credentials Form */}
      <form
        onSubmit={handleCredentialsSignup}
        className="space-y-4 text-left"
      >

        {/* Business Name */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wide">
            Business Name
          </label>

          <input
            type="text"
            placeholder="Paynexa Studio"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full mt-1.5 p-3.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-800"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wide">
            Email Address
          </label>

          <input
            type="email"
            placeholder="merchant@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1.5 p-3.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-800"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wide">
            Password
          </label>

          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 pr-14 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-800"
              required
              disabled={isSubmitting}
              minLength={8}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-blue-600 uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Password Strength */}
          {password && (
            <div className="mt-2 px-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Strength
                </span>

                <span className="text-[10px] font-black uppercase text-gray-500">
                  {passwordFeedback.label}
                </span>
              </div>

              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                <div
                  className={`h-full flex-1 transition-all duration-300 ${
                    passwordFeedback.score >= 1
                      ? passwordFeedback.color
                      : "bg-gray-100"
                  }`}
                />

                <div
                  className={`h-full flex-1 transition-all duration-300 ${
                    passwordFeedback.score >= 2
                      ? passwordFeedback.color
                      : "bg-gray-100"
                  }`}
                />

                <div
                  className={`h-full flex-1 transition-all duration-300 ${
                    passwordFeedback.score >= 3
                      ? passwordFeedback.color
                      : "bg-gray-100"
                  }`}
                />

                <div
                  className={`h-full flex-1 transition-all duration-300 ${
                    passwordFeedback.score >= 4
                      ? passwordFeedback.color
                      : "bg-gray-100"
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wide">
            Confirm Password
          </label>

          <div className="relative mt-1.5">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full p-3.5 pr-14 rounded-xl border bg-gray-50 focus:bg-white focus:ring-2 outline-none transition-all text-sm font-medium text-gray-800 ${
                confirmPassword
                  ? password === confirmPassword
                    ? "border-green-200 focus:ring-green-500/20 focus:border-green-500"
                    : "border-red-200 focus:ring-red-500/20 focus:border-red-500"
                  : "border-gray-100 focus:ring-blue-500/20 focus:border-blue-500"
              }`}
              required
              disabled={isSubmitting}
              minLength={8}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              disabled={isSubmitting}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-blue-600 uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 text-center">
            {errorMessage}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-100 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {isSubmitting
            ? "Creating Account..."
            : "Create Merchant Account"}
        </button>
      </form>

      {/* Login */}
      <div className="mt-6 text-center text-xs text-gray-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-blue-600 font-bold hover:underline"
        >
          Log in
        </Link>
      </div>

      {/* Terms */}
      <p className="mt-6 text-[10px] text-gray-400 text-center px-4 leading-normal">
        By signing up, you agree to Paynexa&apos;s{" "}
        <Link
          href="/terms"
          className="text-gray-500 underline mx-0.5"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-gray-500 underline ml-0.5"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4 py-12">
      <Suspense
        fallback={
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center border border-gray-100 shadow-xl">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

            <p className="text-sm font-medium text-gray-400">
              Loading signup portal...
            </p>
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </main>
  )
}