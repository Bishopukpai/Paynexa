import React from 'react';
import { ChevronRight, ShieldCheck, Zap, Globe, Mail, Phone, MapPin } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">P</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">PAYNEXA</span>
          </div>
          
          <button className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-blue-600 transition-all text-sm">
            Sign Up
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-6">
            Accept Crypto Payments <br />
            <span className="text-blue-600">Without the Complexity.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 font-medium">
            The smart gateway for businesses to accept USDT and USDC. Automated merchant splits, low fees, and lightning-fast settlements.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 hover:scale-105 transition-transform flex items-center justify-center gap-2">
              Get Started Now <ChevronRight size={20} />
            </button>
            <button className="w-full sm:w-auto bg-white text-slate-600 border border-gray-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all">
              View Documentation
            </button>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="text-blue-600" size={32} />}
              title="Secure Settlements"
              desc="Built on audited smart contracts ensuring your funds move safely from customer to merchant."
            />
            <FeatureCard 
              icon={<Zap className="text-orange-500" size={32} />}
              title="Instant Splits"
              desc="Automated 1.5% platform fee deduction happens on-chain. No manual invoicing required."
            />
            <FeatureCard 
              icon={<Globe className="text-green-600" size={32} />}
              title="Token Agnostic"
              desc="Accept USDT, USDC, or any ERC-20 stablecoin across multiple EVM networks."
            />
          </div>
        </div>
      </section>

      {/* --- FOOTER / CONTACT --- */}
      <footer className="bg-slate-900 text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-slate-800 pb-16">
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-xl font-bold tracking-tight">PAYNEXA</span>
            </div>
            <p className="text-slate-400 max-w-sm mb-6">
              Empowering the next generation of SaaS with decentralized payment infrastructure.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-slate-200">Contact Us</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-blue-400" /> support@paynexa.io
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-blue-400" /> +1 (555) 000-PAY
              </li>
              <li className="flex items-center gap-3 text-left">
                <MapPin size={16} className="text-blue-400 flex-shrink-0" /> 
                123 Blockchain Ave, <br />Digital Valley, CA
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-slate-200">Legal</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-8 text-center text-slate-500 text-xs">
          © {new Date().getFullYear()} Paynexa Gateway. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 hover:shadow-xl transition-all group">
      <div className="mb-6 p-4 bg-slate-50 w-fit rounded-2xl group-hover:bg-blue-50 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}