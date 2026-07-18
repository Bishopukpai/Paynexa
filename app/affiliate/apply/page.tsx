"use client";

import React, { useState, useEffect } from "react";

// List of all 195 universally recognized UN Member States & Observers
const ALL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", 
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", 
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", 
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", 
  "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", 
  "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", 
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", 
  "Guyana", "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", 
  "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", 
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", 
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", 
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", 
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", 
  "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", 
  "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", 
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", 
  "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", 
  "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", 
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", 
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
].sort();

export default function MultiStepAffiliateApplyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ status: "success" | "error"; text: string } | null>(null);
  const [ianaTimeZones, setIanaTimeZones] = useState<string[]>([]);

  // Consolidated Application Data Structure
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    name: "",
    email: "",
    phone: "",
    country: "",
    timeZone: "",

    // Step 2: Promotion Profile
    primaryPlatform: "LinkedIn",
    websiteOrSocial: "",
    socialProfiles: "",
    audienceSize: "0–1,000",

    // Step 3: Audience Details
    targetAudience: [] as string[],
    promotionMethods: [] as string[],

    // Step 4: Experience
    promotedSaaSBefore: "No",
    promotedCryptoBefore: "No",
    currentPrograms: "",
    estimatedMonthlyReferrals: "0-5",

    // Step 5: Payout Framework Options
    preferredPayout: "USDC",
    walletAddress: "",
    walletNetwork: "Base",
    bankName: "",
    accountName: "",
    accountNumber: "",
    swiftCode: "",

    // Step 6: Agreements
    agreedToTerms: false,
    noSpamConfirmed: false,
    qualifiedOnlyUnderstood: false,
    dataAccuracyConfirmed: false,
  });

  // Pull comprehensive standard IANA zones list safely across runtimes on mount
  useEffect(() => {
    try {
      if (typeof Intl !== "undefined" && (Intl as any).supportedValuesOf) {
        const zones = (Intl as any).supportedValuesOf("timeZone");
        setIanaTimeZones(zones);
        // Pre-select user's current local runtime zone safely if present
        const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (zones.includes(localZone)) {
          setFormData(prev => ({ ...prev, timeZone: localZone }));
        }
      } else {
        throw new Error("Intl fallback trigger");
      }
    } catch {
      // Fallback baseline for legacy layout layers
      setIanaTimeZones([
        "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi",
        "America/Argentina/Buenos_Aires", "America/Chicago", "America/Los_Angeles", "America/Mexico_City", "America/New_York", "America/Sao_Paulo",
        "Asia/Bangkok", "Asia/Dubai", "Asia/Hong_Kong", "Asia/Jakarta", "Asia/Jerusalem", "Asia/Kolkata", "Asia/Seoul", "Asia/Singapore", "Asia/Tokyo",
        "Australia/Sydney", "Europe/Berlin", "Europe/London", "Europe/Madrid", "Europe/Moscow", "Europe/Paris", "Pacific/Auckland"
      ]);
    }
  }, []);

  const handleCheckboxGroup = (key: "targetAudience" | "promotionMethods", value: string) => {
    setFormData((prev) => {
      const currentList = [...prev[key]];
      if (currentList.includes(value)) {
        return { ...prev, [key]: currentList.filter((item) => item !== value) };
      } else {
        return { ...prev, [key]: [...currentList, value] };
      }
    });
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 6));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 6) return nextStep();

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/affiliate/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || "Application submission processing failed.");
      }

      setMessage({ status: "success", text: result.message });
      setCurrentStep(1);
    } catch (err: any) {
      setMessage({ status: "error", text: err.message || "An unexpected network layout anomaly occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-center py-12 px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest rounded-full border border-blue-200/50">
          Partner Program
        </span>
        <h2 className="mt-4 text-3xl font-black text-slate-900 tracking-tight uppercase">
          Affiliate Program Application
        </h2>
        
        <div className="mt-6 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Step {currentStep} of 6 — {
            currentStep === 1 ? "Personal Profile" :
            currentStep === 2 ? "Promotion Strategy" :
            currentStep === 3 ? "Audience Alignment" :
            currentStep === 4 ? "Partner Experience" :
            currentStep === 5 ? "Payout Assertions" : "Legal Framework"
          }
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/60 rounded-[28px]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* ─── STEP 1: PERSONAL INFORMATION ─── */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide border-b pb-2">Personal Information</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Full Name / Entity *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Email Address *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="john@company.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Phone Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="+1 (555) 000-0000" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Updated Country Field Dropdown Dropin */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase">Country *</label>
                    <select 
                      required 
                      value={formData.country} 
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })} 
                      className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Select country...</option>
                      {ALL_COUNTRIES.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  {/* Updated Time Zone IANA Field Dropdown Dropin */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase">Time Zone (IANA) *</label>
                    <select 
                      required 
                      value={formData.timeZone} 
                      onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })} 
                      className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Select time zone...</option>
                      {ianaTimeZones.map((zone) => (
                        <option key={zone} value={zone}>{zone}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 2: PROMOTION PROFILE ─── */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide border-b pb-2">Promotion Channel Architecture</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Primary Platform *</label>
                  <select value={formData.primaryPlatform} onChange={(e) => setFormData({ ...formData, primaryPlatform: e.target.value })} className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                    {["LinkedIn", "X (Twitter)", "YouTube", "Blog Website", "Newsletter", "Agency Portfolio", "Community Dev", "Other"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Website / Hub URL <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <input type="url" value={formData.websiteOrSocial} onChange={(e) => setFormData({ ...formData, websiteOrSocial: e.target.value })} className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="https://myplatform.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Social Media Profile Links *</label>
                  <textarea required value={formData.socialProfiles} onChange={(e) => setFormData({ ...formData, socialProfiles: e.target.value })} rows={2} className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="e.g., linkedin.com/in/username, x.com/username" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Aggregated Audience Size *</label>
                  <select value={formData.audienceSize} onChange={(e) => setFormData({ ...formData, audienceSize: e.target.value })} className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                    {["0–1,000", "1,000–5,000", "5,000–10,000", "10,000–50,000", "50,000+"].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ─── STEP 3: AUDIENCE DETAILS ─── */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide border-b pb-2">Target Demographics</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Who populates your target footprint? (Select All)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["SaaS Founders", "Web3 Builders", "E-commerce Hubs", "Engineers/Devs", "Agencies", "Startups"].map((aud) => (
                      <label key={aud} className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
                        <input type="checkbox" checked={formData.targetAudience.includes(aud)} onChange={() => handleCheckboxGroup("targetAudience", aud)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                        {aud}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Preferred Content Delivery Formats (Select All)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Blog Articles", "Video Injections", "Technical Guides", "Newsletters", "Social Feeds", "Webinars/Discord"].map((mth) => (
                      <label key={mth} className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
                        <input type="checkbox" checked={formData.promotionMethods.includes(mth)} onChange={() => handleCheckboxGroup("promotionMethods", mth)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                        {mth}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 4: EXPERIENCE ─── */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide border-b pb-2">Experience Matrix</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase">Promoted SaaS before?</label>
                    <select value={formData.promotedSaaSBefore} onChange={(e) => setFormData({ ...formData, promotedSaaSBefore: e.target.value })} className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase">Promoted Web3 before?</label>
                    <select value={formData.promotedCryptoBefore} onChange={(e) => setFormData({ ...formData, promotedCryptoBefore: e.target.value })} className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Current Affiliate Engagements <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <input type="text" value={formData.currentPrograms} onChange={(e) => setFormData({ ...formData, currentPrograms: e.target.value })} className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="e.g. Stripe Partners, AWS Impact" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Estimated Monthly Conversion Targets *</label>
                  <select value={formData.estimatedMonthlyReferrals} onChange={(e) => setFormData({ ...formData, estimatedMonthlyReferrals: e.target.value })} className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                    {["0-5", "5-20", "20-50", "50+"].map((ref) => (
                      <option key={ref} value={ref}>{ref} merchants / mo</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ─── STEP 5: PAYMENT DETAILS ─── */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide border-b pb-2">Settlement & Payout Configuration</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Preferred Payout Medium *</label>
                  <select value={formData.preferredPayout} onChange={(e) => setFormData({ ...formData, preferredPayout: e.target.value })} className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                    <option value="USDC">USDC Token Settlement (On-Chain)</option>
                    <option value="Bank">Traditional Fiat Bank Wire Transfer</option>
                  </select>
                </div>

                {formData.preferredPayout === "USDC" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase">Settlement Wallet Destination Address *</label>
                      <input type="text" required={formData.preferredPayout === "USDC"} value={formData.walletAddress} onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })} className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs" placeholder="0x..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase">Target Cryptographic Network Ledger *</label>
                      <select value={formData.walletNetwork} onChange={(e) => setFormData({ ...formData, walletNetwork: e.target.value })} className="mt-1.5 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                        {["Base", "Ethereum Mainnet", "Polygon", "Arbitrum"].map((net) => (
                          <option key={net} value={net}>{net}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-slate-700">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase">Bank Name *</label>
                        <input type="text" required={formData.preferredPayout === "Bank"} value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="mt-1.5 block w-full px-4 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase">Account Name Beneficiary *</label>
                        <input type="text" required={formData.preferredPayout === "Bank"} value={formData.accountName} onChange={(e) => setFormData({ ...formData, accountName: e.target.value })} className="mt-1.5 block w-full px-4 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase">Account Number / IBAN *</label>
                      <input type="text" required={formData.preferredPayout === "Bank"} value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} className="mt-1.5 block w-full px-4 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase">SWIFT / BIC Routing Code <span className="text-slate-400 font-normal">(Optional)</span></label>
                      <input type="text" value={formData.swiftCode} onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })} className="mt-1.5 block w-full px-4 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 6: AGREEMENTS ─── */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide border-b pb-2">Framework Affirmation & Governance</h3>
                <div className="space-y-3">
                  {[
                    { id: "agreedToTerms", text: "I explicitly endorse the operational conditions outlined in the Paynexa Affiliate Policy Architecture document." },
                    { id: "noSpamConfirmed", text: "I commit to strict compliance under anti-spam provisions; zero malicious attribution arrays or traffic manipulation routes." },
                    { id: "qualifiedOnlyUnderstood", text: "I acknowledge that compensation tracking relies securely on qualified conversions containing programmatic subscription triggers." },
                    { id: "dataAccuracyConfirmed", text: "I certify that all details regarding channel size, asset identities, and parameters provided are authentic." },
                  ].map((field) => (
                    <label key={field.id} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl cursor-pointer hover:bg-slate-100/60 transition-colors">
                      <input 
                        type="checkbox" 
                        required
                        checked={(formData as any)[field.id]} 
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })} 
                        className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="text-xs font-medium text-slate-600 leading-normal">{field.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {message && (
              <div className={`p-4 rounded-xl text-xs font-bold tracking-wide border ${
                message.status === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-2.5 border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 bg-white rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                >
                  Previous
                </button>
              ) : <div />}

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all disabled:opacity-50 active:scale-95"
              >
                {loading ? "Processing..." : currentStep === 6 ? "Submit Application" : "Next Step"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}