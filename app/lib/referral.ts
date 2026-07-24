// lib/referral.ts
import { cookies } from 'next/headers'

export const REFERRAL_COOKIE_NAME = 'paynexa_ref'

/**
 * 1. Server-Side Helper (App Router, Server Actions, API Routes, & Route Handlers)
 */
export async function getStoredReferralCode(): Promise<string | null> {
  const cookieStore = await cookies()
  const refCookie = cookieStore.get(REFERRAL_COOKIE_NAME)
  return refCookie?.value || null
}

/**
 * 2. Server-Side Helper to clear referral cookie post registration
 */
export async function clearStoredReferralCode(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(REFERRAL_COOKIE_NAME)
}

/**
 * 3. Client-Side Helper ('use client' React components)
 */
export function getStoredReferralCodeClient(): string | null {
  if (typeof window === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${REFERRAL_COOKIE_NAME}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}