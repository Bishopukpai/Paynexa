"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Ban,
  Eye,
  RefreshCw,
  X,
  CreditCard,
  Globe,
  Users,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

interface Affiliate {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  timeZone: string;
  primaryPlatform: string;
  socialProfiles: string;
  audienceSize: string;
  targetAudience: string[];
  promotionMethods: string[];
  promotedSaaSBefore: string;
  promotedCryptoBefore: string;
  currentPrograms?: string;
  estimatedMonthlyReferrals: string;
  preferredPayout: "USDC" | "Bank";
  walletAddress?: string;
  walletNetwork?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  referralCode?: string;
  createdAt: string;
}

export default function AdminAffiliatesStudio() {
  const { status: sessionStatus } = useSession();

  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);

  // Load data once session is ready
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchAffiliates();
    }
  }, [sessionStatus]);

  const fetchAffiliates = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/affiliate/admin");
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load directory.");

      if (data.success) {
        setAffiliates(data.data || []);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unknown error occurred";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (affiliateId: string, action: "approve" | "reject" | "suspend") => {
    setActionLoading(affiliateId);
    try {
      const res = await fetch("/api/affiliate/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId, action }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Action failed.");

      if (data.success) {
        // Optimistic / local state update
        setAffiliates((prev) =>
          prev.map((item) =>
            item._id === affiliateId
              ? {
                  ...item,
                  status: data.data.status,
                  referralCode: data.data.referralCode || item.referralCode,
                }
              : item
          )
        );

        if (selectedAffiliate && selectedAffiliate._id === affiliateId) {
          setSelectedAffiliate((prev) =>
            prev
              ? {
                  ...prev,
                  status: data.data.status,
                  referralCode: data.data.referralCode || prev.referralCode,
                }
              : null
          );
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      alert("Error: " + errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter logic
  const filteredAffiliates = affiliates.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.referralCode && item.referralCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Metrics
  const stats = {
    total: affiliates.length,
    pending: affiliates.filter((a) => a.status === "pending").length,
    approved: affiliates.filter((a) => a.status === "approved").length,
    suspended: affiliates.filter((a) => a.status === "suspended").length,
  };

  // Auth/Session loading screen
  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mb-4 text-lg font-medium animate-pulse text-indigo-400">
            Loading Partner Studio...
          </div>
          <p className="text-sm text-slate-400">Verifying session parameters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-indigo-500" />
              Paynexa Partner Studio
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Review partner applications, inspect marketing channels, and manage referral permissions.
            </p>
          </div>
          <button
            onClick={fetchAffiliates}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium transition text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            Refresh Directory
          </button>
        </div>

        {/* Global Error Alert */}
        {errorMessage && (
          <div className="rounded-lg bg-rose-950/60 border border-rose-800/60 p-4 text-sm text-rose-300 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage("")} className="text-rose-400 hover:text-rose-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Partners</span>
            <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
          </div>
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending Review</span>
            <div className="text-2xl font-bold text-amber-300 mt-1">{stats.pending}</div>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Active Approved</span>
            <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.approved}</div>
          </div>
          <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-4">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Suspended</span>
            <div className="text-2xl font-bold text-rose-300 mt-1">{stats.suspended}</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-4 h-4 text-slate-500 hidden md:block" />
            {["all", "pending", "approved", "rejected", "suspended"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Affiliate Directory Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Affiliate</th>
                  <th className="px-6 py-4 font-semibold">Platform & Audience</th>
                  <th className="px-6 py-4 font-semibold">Payout Type</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Referral Code</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      Loading partner records...
                    </td>
                  </tr>
                ) : filteredAffiliates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      No matching affiliate records found.
                    </td>
                  </tr>
                ) : (
                  filteredAffiliates.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/30 transition">
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.email}</div>
                      </td>

                      {/* Platform */}
                      <td className="px-6 py-4">
                        <div className="text-slate-200">{item.primaryPlatform || "N/A"}</div>
                        <div className="text-xs text-slate-400">{item.audienceSize || "0"} audience</div>
                      </td>

                      {/* Payout */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-950 border border-slate-800 text-slate-300">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          {item.preferredPayout || "USDC"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      {/* Code */}
                      <td className="px-6 py-4">
                        {item.referralCode ? (
                          <code className="text-xs bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 px-2 py-1 rounded font-mono">
                            {item.referralCode}
                          </code>
                        ) : (
                          <span className="text-xs text-slate-600 font-mono">Unassigned</span>
                        )}
                      </td>

                      {/* Action Controls */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedAffiliate(item)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {item.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleAction(item._id, "approve")}
                                disabled={actionLoading === item._id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(item._id, "reject")}
                                disabled={actionLoading === item._id}
                                className="px-3 py-1.5 bg-rose-900/50 hover:bg-rose-800/80 text-rose-300 rounded-lg text-xs font-medium transition border border-rose-800/40 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {item.status === "approved" && (
                            <button
                              onClick={() => handleAction(item._id, "suspend")}
                              disabled={actionLoading === item._id}
                              className="px-3 py-1.5 bg-amber-900/40 hover:bg-amber-800/70 text-amber-300 rounded-lg text-xs font-medium transition border border-amber-800/40 disabled:opacity-50"
                            >
                              Suspend
                            </button>
                          )}

                          {item.status === "suspended" && (
                            <button
                              onClick={() => handleAction(item._id, "approve")}
                              disabled={actionLoading === item._id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                            >
                              Re-Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Inspection Modal Drawer */}
      {selectedAffiliate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedAffiliate.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedAffiliate.email}</p>
              </div>
              <button
                onClick={() => setSelectedAffiliate(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-medium text-slate-400 uppercase">Current Account State</span>
              <StatusBadge status={selectedAffiliate.status} />
            </div>

            {/* Marketing Channels */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" /> Platform & Reach
              </h3>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Primary Platform:</span> <span className="font-medium text-slate-200">{selectedAffiliate.primaryPlatform || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Audience Size:</span> <span className="font-medium text-slate-200">{selectedAffiliate.audienceSize || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Social Profiles:</span> <span className="font-medium text-indigo-400 underline">{selectedAffiliate.socialProfiles || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Est. Monthly Referrals:</span> <span className="font-medium text-slate-200">{selectedAffiliate.estimatedMonthlyReferrals || "N/A"}</span></div>
              </div>
            </div>

            {/* Experience & Methods */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Marketing Experience
              </h3>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Promoted SaaS Before:</span> <span className="font-medium text-slate-200">{selectedAffiliate.promotedSaaSBefore || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Promoted Crypto Before:</span> <span className="font-medium text-slate-200">{selectedAffiliate.promotedCryptoBefore || "N/A"}</span></div>
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-500 block text-xs mb-1">Target Audiences:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedAffiliate.targetAudience || []).map((aud, i) => (
                      <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {aud}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Payout Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" /> Banking & Wallet Details
              </h3>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Preferred Payout:</span> <span className="font-medium text-white">{selectedAffiliate.preferredPayout || "USDC"}</span></div>
                {selectedAffiliate.preferredPayout === "USDC" ? (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">Network:</span> <span className="font-medium text-slate-200">{selectedAffiliate.walletNetwork || "N/A"}</span></div>
                    <div className="pt-1"><span className="text-slate-500 text-xs block">Wallet Address:</span> <code className="text-xs text-indigo-300 break-all font-mono">{selectedAffiliate.walletAddress || "N/A"}</code></div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">Bank Name:</span> <span className="font-medium text-slate-200">{selectedAffiliate.bankName || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Account Name:</span> <span className="font-medium text-slate-200">{selectedAffiliate.accountName || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Account Number:</span> <span className="font-mono text-slate-200">{selectedAffiliate.accountNumber || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">SWIFT Code:</span> <span className="font-mono text-slate-200">{selectedAffiliate.swiftCode || "N/A"}</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Actions Inside Modal */}
            <div className="pt-4 border-t border-slate-800 flex gap-3">
              {selectedAffiliate.status === "pending" && (
                <>
                  <button
                    onClick={() => handleAction(selectedAffiliate._id, "approve")}
                    disabled={actionLoading === selectedAffiliate._id}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition disabled:opacity-50"
                  >
                    Approve Application
                  </button>
                  <button
                    onClick={() => handleAction(selectedAffiliate._id, "reject")}
                    disabled={actionLoading === selectedAffiliate._id}
                    className="flex-1 py-2.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-medium rounded-lg text-sm transition disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}

              {selectedAffiliate.status === "approved" && (
                <button
                  onClick={() => handleAction(selectedAffiliate._id, "suspend")}
                  disabled={actionLoading === selectedAffiliate._id}
                  className="w-full py-2.5 bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 font-medium rounded-lg text-sm transition disabled:opacity-50"
                >
                  Suspend Partner Account
                </button>
              )}

              {selectedAffiliate.status === "suspended" && (
                <button
                  onClick={() => handleAction(selectedAffiliate._id, "approve")}
                  disabled={actionLoading === selectedAffiliate._id}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition disabled:opacity-50"
                >
                  Re-Approve Partner Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for clean status badges
function StatusBadge({ status }: { status: Affiliate["status"] }) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950/80 border border-amber-800/60 text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5" /> Pending
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-500">
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </span>
      );
    case "suspended":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950/80 border border-rose-800/60 text-rose-300">
          <Ban className="w-3.5 h-3.5" /> Suspended
        </span>
      );
    default:
      return null;
  }
}