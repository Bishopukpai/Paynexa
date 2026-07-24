'use client'

import { useState, useEffect } from 'react'

interface ReferralLinkCardProps {
  referralCode: string
}

export default function ReferralLinkCard({ referralCode }: ReferralLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [fullUrl, setFullUrl] = useState('')

  useEffect(() => {
    // 1. Prioritize environment variable (e.g. https://paynexa.com)
    // 2. Fall back to current browser origin (localhost or deployed domain)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    // 🎯 Targets the signup page directly with the referral parameter
    setFullUrl(`${baseUrl}/signup?ref=${referralCode}`)
  }, [referralCode])

  const handleCopy = async () => {
    if (!fullUrl) return
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Your Unique Referral Link</h3>
        <p className="text-xs text-gray-500 mt-1">
          Share this link with potential merchants. Anyone who signs up using your code will be tied to your affiliate profile.
        </p>
      </div>

      <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
        <input
          type="text"
          readOnly
          value={fullUrl || 'Loading referral link...'}
          className="bg-transparent flex-1 text-xs font-mono font-bold text-gray-700 outline-none px-3 select-all"
        />
        <button
          onClick={handleCopy}
          disabled={!fullUrl}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
        >
          {copied ? 'Copied! ✓' : 'Copy Link'}
        </button>
      </div>
    </div>
  )
}