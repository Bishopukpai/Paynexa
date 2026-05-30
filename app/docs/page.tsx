'use client'

import React, { useState } from 'react'

export default function DeveloperDocs() {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(id)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const webhookPayload = `{
  "id": "sub_6182937192",
  "event": "subscription.created",
  "createdAt": "2026-05-27T08:30:00.000Z",
  "data": {
    "userAddress": "0x71c7656ec7ab88b098defb751b7401b5f6d8976f",
    "userEmail": "customer@merchant.com",
    "planId": "65f12a3b4c5d6e7f8a9b0c1d",
    "transactionHash": "0x93b2a...714f",
    "expiryDate": "2026-06-27T08:30:00.000Z",
    "status": "active"
  }
}`

  const webhookNodeCode = `const crypto = require('crypto');

app.post('/webhooks/paynexa', (req, res) => {
  const signature = req.headers['x-paynexa-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify webhook origins using your private signing secret
  const expectedSignature = crypto
    .createHmac('sha256', process.env.PAYNEXA_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature handshake');
  }

  const { event, data } = req.body;
  if (event === 'subscription.created') {
    // 🔓 Unlock your SaaS infrastructure tier access here
    console.log(\`Provisioning access for \${data.userEmail}\`);
  }

  res.status(200).json({ received: true });
});`

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* --- SIDEBAR NAVIGATION --- */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full p-6 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-base">P</span>
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tight">Paynexa Devs</span>
        </div>
        
        <nav className="space-y-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Getting Started</p>
            <ul className="space-y-2 text-sm font-medium">
              <li><a href="#intro" className="text-blue-600 block py-1">Overview</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Integration Guide</p>
            <ul className="space-y-2 text-sm text-slate-600 font-medium">
              <li><a href="#step1" className="hover:text-slate-900 block py-1">Step 1: Generating a Plan Link</a></li>
              <li><a href="#step2" className="hover:text-slate-900 block py-1">Step 2: Embedding the Checkout</a></li>
              <li><a href="#step3" className="hover:text-slate-900 block py-1">Step 3: Post-Payment Redirects</a></li>
              <li><a href="#step4" className="hover:text-slate-900 block py-1">Step 4: Webhook Verification</a></li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* --- MAIN CORE CONTENT PANEL --- */}
      <main className="flex-1 md:ml-64 px-6 py-12 lg:px-16 max-w-4xl">
        <section id="intro" className="mb-12 scroll-mt-20">
          <div className="inline-block bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
            v1.0.0 Documentation
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Merchant Integration Engine</h1>
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            Welcome to the Paynexa API guide. In less than 5 minutes, you can plug crypto native non-custodial recurring subscription checking parameters right into your frontend layout application or SaaS platform.
          </p>

          {/* --- SENTRY DIAGNOSTICS TELEMETRY TESTING CONTAINER --- */}
          <div className="bg-slate-100 border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-bold text-slate-900 text-sm mb-1">🛡️ Sentry Diagnostic Verification</p>
              <p className="text-xs text-slate-500 max-w-md">
                Click this button to fire an intentional component exception. Use it to check if telemetry data arrives safely inside your cloud issue stream dashboard tracker.
              </p>
            </div>
            <button
              onClick={() => {
                throw new Error("Paynexa Frontend Test Crash: Wallet Hook Disrupted");
              }}
              className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700 shadow-sm self-start sm:self-center transition-colors whitespace-nowrap"
            >
              🔥 Test Sentry Frontend
            </button>
          </div>
        </section>

        <hr className="border-slate-200 my-10" />

        {/* --- STEP 1 --- */}
        <section id="step1" className="mb-14 scroll-mt-20">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">Step 1: Generating a Subscription Plan Link</h2>
          <p className="text-slate-600 mb-4 leading-relaxed">
            Before routing customer checkout attempts, you must define your pricing terms directly on our smart dashboard interface layers:
          </p>
          <ol className="list-decimal list-inside space-y-3 text-slate-600 mb-6 font-medium text-sm bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
            <li>Connect your business owner Web3 wallet on the <strong className="text-slate-900">Merchant Dashboard</strong> page.</li>
            <li>Click on the <strong className="text-blue-600">+ Create Plan</strong> action anchor button in the global navbar header.</li>
            <li>Provide your subscription name variables, desired pricing structure parameters, and billing interval schedules (e.g., Monthly, Yearly).</li>
            <li>Confirm the creation step. Your generated tier array instantly allocates a secure link string variable formatted as: <code className="bg-slate-100 px-1.5 py-0.5 border rounded text-blue-600 font-mono font-bold text-xs">/checkout/[PLAN_ID]</code>.</li>
          </ol>
        </section>

        {/* --- STEP 2 --- */}
        <section id="step2" className="mb-14 scroll-mt-20">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">Step 2: Embedding Your Checkout Link</h2>
          <p className="text-slate-600 mb-4 leading-relaxed">
            Copy your unique link string from the dashboard overview table list and hook it up directly to call actions, landing layouts, or payment cards anywhere on your website code stack:
          </p>
          
          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-sm relative border border-slate-800 shadow-lg">
            <button 
              onClick={() => copyToClipboard('<a href="https://paynexa.com/checkout/YOUR_PLAN_ID" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Subscribe with Web3 Wallet</a>', 'htmlCode')}
              className="absolute top-4 right-4 text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-slate-300"
            >
              {copiedText === 'htmlCode' ? 'Copied! ✅' : 'Copy'}
            </button>
            <pre className="overflow-x-auto whitespace-pre-wrap pr-12">
{`<a href="https://paynexa.com/checkout/YOUR_PLAN_ID" 
   style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
  Subscribe with Web3 Wallet
</a>`}
            </pre>
          </div>
        </section>

        {/* --- STEP 3 --- */}
        <section id="step3" className="mb-14 scroll-mt-20">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">Step 3: Handling Post-Payment Redirects</h2>
          <p className="text-slate-600 mb-4 leading-relaxed">
            Once a user verifies their wallet connection and submits their payment signature transaction safely on our secure interface, Paynexa automatically forwards them back to the destination callback URL designated inside your account profile settings.
          </p>
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex gap-3 text-amber-800 text-sm">
            <span className="text-lg">💡</span>
            <div>
              <p className="font-bold mb-1">Pass Passthrough Data via URL Query Strings</p>
              <p className="leading-relaxed">
                Want to map accounts easily? Append custom parameters like <code className="bg-amber-100/80 px-1 py-0.5 rounded text-amber-900 font-mono">?email=user@test.com</code> to your payment link target. Paynexa will carry these query strings cleanly along to your callback success dashboard!
              </p>
            </div>
          </div>
        </section>

        {/* --- STEP 4 --- */}
        <section id="step4" className="mb-14 scroll-mt-20">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-4">Step 4: Verifying the Webhook Payload</h2>
          <p className="text-slate-600 mb-4 leading-relaxed">
            Whenever a customer registers an active billing window, our background infrastructure fires an asynchronous HTTP <code className="bg-slate-100 px-1.5 py-0.5 rounded border text-slate-800 font-mono text-xs">POST</code> request event trigger directly into your application webhook destination.
          </p>

          <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2">JSON Structure Response Payload</h3>
          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-sm relative border border-slate-800 shadow-lg mb-6">
            <button 
              onClick={() => copyToClipboard(webhookPayload, 'jsonCode')}
              className="absolute top-4 right-4 text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-slate-300"
            >
              {copiedText === 'jsonCode' ? 'Copied! ✅' : 'Copy'}
            </button>
            <pre className="overflow-x-auto whitespace-pre pr-12">{webhookPayload}</pre>
          </div>

          <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-2">Verifying Node.js Webhook Handshake (SHA256)</h3>
          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-sm relative border border-slate-800 shadow-lg">
            <button 
              onClick={() => copyToClipboard(webhookNodeCode, 'nodeCode')}
              className="absolute top-4 right-4 text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-slate-300"
            >
              {copiedText === 'nodeCode' ? 'Copied! ✅' : 'Copy'}
            </button>
            <pre className="overflow-x-auto whitespace-pre pr-12">{webhookNodeCode}</pre>
          </div>
        </section>
      </main>
    </div>
  )
}