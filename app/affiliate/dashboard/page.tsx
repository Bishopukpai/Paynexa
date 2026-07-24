import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import ReferralLinkCard from '@/components/ReferralLinkCard'

export default async function AffiliateDashboardPage() {
  const session = await getServerSession(authOptions)

  // Protect route if user is not logged in
  if (!session || !session.user) {
    redirect('/login')
  }

  // Retrieve dynamic affiliateCode injected into session via NextAuth callbacks
  const userReferralCode =
    (session.user as any).affiliateCode ||
    session.user.name?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() ||
    'REF'

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Affiliate Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back, {session.user.name || 'Partner'}! Share your referral link to earn commissions.
        </p>
      </div>

      {/* Render the referral card with dynamic code */}
      <ReferralLinkCard referralCode={userReferralCode} />
    </main>
  )
}