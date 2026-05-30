'use client'

import posthog from 'posthog-js'
import { PostHogProvider as Provider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog in the browser environment and if the key exists
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only', // Recommended setting for modern PostHog tracking
        capture_pageview: true, // Automatically tracks whenever merchants navigate between pages
      })
    }
  }, [])

  return <Provider client={posthog}>{children}</Provider>
}