"use client";

import React from "react";
import Link from "next/link";

export default function TermsOfUsePage() {
  const lastUpdated = "May 31, 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      {/* HEADER HERO STRIP */}
      <div className="bg-slate-900 py-16 px-6 sm:px-8 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="px-4 py-1.5 bg-blue-600/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-4 inline-block border border-blue-500/20">
            Legal Framework
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-none">
            TERMS OF USE
          </h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">
            Last Updated: {lastUpdated}
          </p>
        </div>
      </div>

      {/* CORE LEGAL TEXT CONTAINER */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-16">
        <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-sm border border-slate-200/60 space-y-10">
          
          {/* INTRO */}
          <section className="prose prose-slate max-w-none">
            <p className="text-lg leading-relaxed text-slate-600 font-medium">
              Welcome to our platform (the &ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and use of our website, API endpoints, smart contracts, and decentralized checkout services (collectively, the &ldquo;Services&rdquo;).
            </p>
            <p className="text-slate-600 mt-4">
              By creating an account, linking a cryptographic wallet, or utilizing our checkout infrastructure, you agree to be bound by these Terms. If you do not agree to these terms, you must immediately cease using the platform.
            </p>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
              <span className="text-sm bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg font-mono">01</span>
              Eligibility &amp; Account Registration
            </h2>
            <div className="pl-11 space-y-3 text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-900">1.1 Merchant Accounts:</strong> To register as a SaaS provider or Merchant, you must be capable of forming a binding contract under applicable law. You are responsible for ensuring that all account configuration details, metadata, and webhook endpoints provided to the platform remain accurate and secure.
              </p>
              <p>
                <strong className="text-slate-900">1.2 Cryptographic Wallet Integration:</strong> Access to certain settlement or configuration layers requires interaction with a non-custodial cryptocurrency wallet. You acknowledge that you are solely responsible for maintaining the security of your private keys, seed phrases, and wallet access permissions. We never have access to, nor custody of, your private cryptographic credentials.
              </p>
            </div>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
              <span className="text-sm bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg font-mono">02</span>
              Description of Services
            </h2>
            <div className="pl-11 space-y-3 text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-900">2.1 Subscription Middleware:</strong> The Platform provides visual dashboards, API route handlers, and deployment configuration systems allowing merchants to model transactional subscription tiers using digital assets (including but not limited to USDT and ETH).
              </p>
              <p>
                <strong className="text-slate-900">2.2 Decentralized Smart Contracts:</strong> Certain operations interact directly with public blockchain networks (e.g., testnets and mainnet protocols). You understand that transactions committed to a blockchain are immutable, irreversible, and subject to variable gas fee costs which are completely outside of our control.
              </p>
            </div>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
              <span className="text-sm bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg font-mono">03</span>
              Pricing, Fees, and Settlement
            </h2>
            <div className="pl-11 space-y-3 text-slate-600 leading-relaxed">
              <p>
                Merchants are solely responsible for setting pricing criteria, billing frequencies (hourly, daily, monthly, yearly), and verifying public key destination parameters (<code className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-xs text-rose-600">businessAddress</code>) used inside payment pipelines.
              </p>
              <p>
                We reserve the right to charge a structural software license or protocol usage fee per transaction processed through our smart contracts. Any applicable protocol fees will be calculated and displayed to users prior to transaction initialization.
              </p>
            </div>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
              <span className="text-sm bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg font-mono">04</span>
              Prohibited Activities
            </h2>
            <div className="pl-11 space-y-2 text-slate-600 leading-relaxed">
              <p>You agree not to engage in any of the following prohibited behaviors while interacting with our ecosystem:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
                <li>Using the platform to launder money, finance terrorism, or bypass international trade sanctions.</li>
                <li>Attempting to exploit, brute-force, inject malicious scripts, or bypass code verification routes on our Next.js backend servers or deployed smart contracts.</li>
                <li>Registering a cryptographic profile address under a corporate identity or brand trademark that you do not legally own.</li>
                <li>Configuring platform webhooks to broadcast data requests toward endpoints hosting spyware, malware, or phishing interfaces.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
              <span className="text-sm bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg font-mono">05</span>
              Intellectual Property Rights
            </h2>
            <div className="pl-11 space-y-3 text-slate-600 leading-relaxed">
              <p>
                The visual components, dashboard interfaces, database configurations, backend architecture, proprietary codebases, logos, and branding elements are the exclusive intellectual property of the Platform and its licensors.
              </p>
              <p>
                Merchants retain full intellectual property rights over files uploaded to our system buckets (such as custom brand identity graphics or <code className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-xs text-rose-600">companyLogo</code> assets). By uploading these materials, you grant us a worldwide, non-exclusive, royalty-free license to render and display these assets on public checkout routing screens strictly for executing payment sequences.
              </p>
            </div>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
              <span className="text-sm bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg font-mono">06</span>
              Disclaimers &amp; Limitation of Liability
            </h2>
            <div className="pl-11 space-y-4 text-slate-600 leading-relaxed">
              <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-5 text-sm text-slate-700 leading-relaxed">
                <span className="font-black text-amber-800 uppercase block mb-1">Notice of Risk Waiver</span>
                THE SERVICES ARE PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR COMPLETELY ERROR-FREE.
              </div>
              <p>
                You explicitly recognize that blockchain software frameworks, smart contract interactions, and cryptographic asset classes carry inherent structural risks. We assume zero liability for losses stemming from wallet software failures, compromised keys, network congestion, smart contract exploits, or parameter setup typos (e.g., typos in a <code className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-xs text-rose-600">businessAddress</code>).
              </p>
            </div>
          </section>

          {/* SECTION 7 */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
              <span className="text-sm bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg font-mono">07</span>
              Amendments &amp; Contact
            </h2>
            <div className="pl-11 space-y-3 text-slate-600 leading-relaxed">
              <p>
                We may update these Terms from time to time to accommodate adjustments to blockchain protocol upgrades, compliance laws, or software infrastructure scaling. Continued usage of our system after modifications go live implies full acceptance of the updated conditions.
              </p>
              <p>
                If you have questions regarding these architectural boundary conditions, system rules, or platform practices, please contact us via our developer repository portal or customer help desk.
              </p>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* FOOTER ACTIONS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <p className="text-xs text-slate-400 font-medium">
              &copy; 2026 Paynexa. All engineering systems and protocols reserved.
            </p>
            <Link 
              href="/"
              className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-sm shadow-slate-900/10 uppercase tracking-wider"
            >
              Return to Gateway
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}