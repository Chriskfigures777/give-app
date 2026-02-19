"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Globe,
  Search,
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  ExternalLink,
  ShoppingCart,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Server,
  ChevronDown,
  ChevronRight,
  Info,
  Link2,
  Zap,
  BookOpen,
  Church,
  Shield,
} from "lucide-react";
import { DnsRecordsPanel } from "./dns-records-panel";

type WizardPath = null | "existing" | "purchase";
type ExistingStep = "enter" | "instructions" | "verify";

type Domain = {
  id: string;
  domain: string;
  status: string;
  verified_at: string | null;
  created_at: string | null;
};

type DomainResult = {
  available: boolean;
  domain: string;
  price: number;
  currency: string;
  period: number;
  definitive: boolean;
};

// DnsRecordsPanel is lazy-imported when the user toggles the DNS section

const REGISTRAR_GUIDES: Record<string, { name: string; url: string }> = {
  godaddy: { name: "GoDaddy", url: "https://www.godaddy.com/help/manage-dns-records-680" },
  namecheap: { name: "Namecheap", url: "https://www.namecheap.com/support/knowledgebase/article.aspx/767/10/how-to-change-dns-for-a-domain/" },
  google: { name: "Google Domains", url: "https://support.google.com/domains/answer/3290350" },
  cloudflare: { name: "Cloudflare", url: "https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/" },
  bluehost: { name: "Bluehost", url: "https://www.bluehost.com/help/article/dns-management-add-edit-or-delete-dns-entries" },
  hostgator: { name: "HostGator", url: "https://www.hostgator.com/help/article/changing-dns-records" },
};

const CF_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || "";
const CNAME_TARGET = CF_DOMAIN || process.env.NEXT_PUBLIC_SITE_CNAME_TARGET || "give-app78.vercel.app";
const VERCEL_IP = "76.76.21.21";
const USE_CLOUDFRONT = !!CF_DOMAIN;

function formatPrice(price: number, currency: string) {
  const amt = price / 1000000;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amt);
}

export function DomainWizard({ organizationId, isPlatformAdmin }: { organizationId: string; isPlatformAdmin?: boolean }) {
  const [path, setPath] = useState<WizardPath>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // ─── Existing domain state ───
  const [existingStep, setExistingStep] = useState<ExistingStep>("enter");
  const [domainInput, setDomainInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [instructions, setInstructions] = useState<{ domainId: string; name: string; value: string; type?: string } | null>(null);
  const [acmRecords, setAcmRecords] = useState<Array<{ type: string; name: string; value: string; domain?: string; status?: string }>>([]);
  const [cfDomainTarget, setCfDomainTarget] = useState<string>("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; message: string } | null>(null);

  // ─── Connected domains ───
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  // ─── Domain search state ───
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DomainResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── DNS panel state ───
  const [showDns, setShowDns] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // ─── Fetch connected domains ───
  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch(`/api/organization-website/domains?organizationId=${encodeURIComponent(organizationId)}`, { credentials: "include" });
      const d = await res.json();
      if (d.domains) setDomains(d.domains);
    } catch { /* ignore */ }
    setLoadingDomains(false);
  }, [organizationId]);

  useEffect(() => { fetchDomains(); }, [fetchDomains]);

  // ─── Connect existing domain ───
  const handleConnectDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = domainInput.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
    if (!domain || !domain.includes(".")) { setError("Enter a valid domain (e.g. www.yourchurch.org)"); return; }
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/organization-website/domains", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ organizationId, domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDomainInput("");
      await fetchDomains();
      if (data.domain && data.instructions) {
        setInstructions({ domainId: data.domain.id, name: data.instructions.name, value: data.instructions.value, type: data.instructions.type });
        setAcmRecords(data.acmValidationRecords ?? []);
        setCfDomainTarget(data.cloudfrontDomain ?? "");
        setExistingStep("instructions");
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    setAdding(false);
  };

  const handleVerifyDomain = async () => {
    if (!instructions) return;
    setVerifying(true);
    setError(null);
    setVerifyResult(null);
    try {
      const res = await fetch("/api/organization-website/domains/verify", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ organizationId, domainId: instructions.domainId, tryRoute53: true }),
      });
      const data = await res.json();
      const verified = !!data.verified;
      const sslReady = !!data.sslReady;
      let message = data.message ?? data.error ?? "";

      // Update ACM records with fresh status from verify response
      if (data.acmValidationRecords?.length) {
        setAcmRecords(data.acmValidationRecords);
      }

      setVerifyResult({ verified, message });
      if (verified && sslReady) {
        await fetchDomains();
        setExistingStep("verify");
      } else if (verified && !sslReady) {
        // DNS verified but SSL not ready yet — stay on instructions page to show ACM info
        await fetchDomains();
      }
    } catch { setVerifyResult({ verified: false, message: "Verification failed" }); }
    setVerifying(false);
  };

  const handleRemoveDomain = async (domainId: string) => {
    setRemoving(domainId);
    try {
      await fetch(`/api/organization-website/domains?domainId=${encodeURIComponent(domainId)}&organizationId=${encodeURIComponent(organizationId)}`, { method: "DELETE", credentials: "include" });
      await fetchDomains();
    } catch { /* ignore */ }
    setRemoving(null);
  };

  // ─── Domain search ───
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) return;
    setSearching(true); setError(null); setSearchNote(null); setSearched(false);
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setSearchResults(data.results ?? []);
      if (data.note) setSearchNote(data.note);
      setSearched(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Search failed"); }
    setSearching(false);
  }, []);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) debounceRef.current = setTimeout(() => doSearch(val.trim()), 600);
    else { setSearchResults([]); setSearched(false); setSearchNote(null); }
  };

  const handleToggleDns = () => setShowDns(!showDns);

  const verifiedDomains = domains.filter(d => d.status === "verified");
  const pendingDomains = domains.filter(d => d.status !== "verified");
  const availableResults = searchResults.filter(r => r.available);

  // ─── RENDER ───

  // === PATH CHOOSER ===
  if (path === null) {
    return (
      <div className="space-y-6">
        {/* Connected domains summary */}
        {verifiedDomains.length > 0 && (
          <div className="space-y-2">
            {verifiedDomains.map(d => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50/80 to-teal-50/60 px-4 py-3 dark:border-emerald-800/40 dark:from-emerald-900/20 dark:to-teal-900/10">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15"><CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{d.domain}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Connected & verified</p>
                  </div>
                </div>
                <button type="button" onClick={() => handleRemoveDomain(d.id)} disabled={removing === d.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                  {removing === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pending domains */}
        {pendingDomains.length > 0 && (
          <div className="space-y-2">
            {pendingDomains.map(d => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-amber-200/60 bg-amber-50/40 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/10">
                <div className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{d.domain}</span>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">{d.status === "failed" ? "Failed" : "Pending"}</span>
                </div>
                <div className="flex gap-1.5">
                  <button type="button" onClick={async () => {
                    setPath("existing");
                    setExistingStep("instructions");
                    setError(null);
                    // Fetch fresh instructions + ACM records from the API
                    try {
                      const res = await fetch("/api/organization-website/domains", {
                        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
                        body: JSON.stringify({ organizationId, domain: d.domain }),
                      });
                      const data = await res.json();
                      if (data.instructions) {
                        setInstructions({ domainId: d.id, name: data.instructions.name, value: data.instructions.value, type: data.instructions.type });
                        setAcmRecords(data.acmValidationRecords ?? []);
                        setCfDomainTarget(data.cloudfrontDomain ?? "");
                      }
                    } catch {
                      const isRoot = !d.domain.startsWith("www.");
                      setInstructions({ domainId: d.id, name: USE_CLOUDFRONT ? "www" : (isRoot ? "@" : "www"), value: USE_CLOUDFRONT ? CNAME_TARGET : (isRoot ? VERCEL_IP : CNAME_TARGET), type: USE_CLOUDFRONT ? "CNAME" : (isRoot ? "A" : "CNAME") });
                    }
                  }} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">Setup DNS</button>
                  <button type="button" onClick={() => handleRemoveDomain(d.id)} disabled={removing === d.id} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                    {removing === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Two-path chooser cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Path A: I have a domain */}
          <button
            type="button"
            onClick={() => { setPath("existing"); setExistingStep("enter"); setError(null); }}
            className="group relative overflow-hidden rounded-2xl border-2 border-slate-200/80 bg-white p-6 text-left transition-all duration-300 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10 dark:border-slate-700/60 dark:bg-slate-800/60 dark:hover:border-sky-500"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 to-cyan-500 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 transition-colors group-hover:bg-sky-500/20 dark:bg-sky-500/20">
              <Church className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
              I already have a domain
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Connect your existing domain (like yourchurch.org) with easy step-by-step DNS instructions.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 transition-colors group-hover:text-sky-700 dark:text-sky-400">
              Get started <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* Path B: I need a domain */}
          <button
            type="button"
            onClick={() => { setPath("purchase"); setError(null); }}
            className="group relative overflow-hidden rounded-2xl border-2 border-slate-200/80 bg-white p-6 text-left transition-all duration-300 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-slate-700/60 dark:bg-slate-800/60 dark:hover:border-emerald-500"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20 dark:bg-emerald-500/20">
              <ShoppingCart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
              I need a new domain
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Search and purchase a perfect domain name for your organization. We&apos;ll help set it up.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 transition-colors group-hover:text-emerald-700 dark:text-emerald-400">
              Find a domain <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        </div>

        {/* DNS Records toggle (platform admin only) */}
        {isPlatformAdmin && (
          <div>
            <button type="button" onClick={handleToggleDns} className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
              <Server className="h-3.5 w-3.5" />
              {showDns ? "Hide" : "Show"} DNS Records (Route 53)
              {showDns ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            {showDns && (
              <div className="mt-3">
                <DnsRecordsPanel />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // === PATH A: EXISTING DOMAIN ===
  if (path === "existing") {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <button type="button" onClick={() => { setPath(null); setExistingStep("enter"); setInstructions(null); setVerifyResult(null); setError(null); }} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to options
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          {["Enter domain", "Configure DNS", "Verify"].map((label, i) => {
            const stepIndex = i;
            const stepMap: ExistingStep[] = ["enter", "instructions", "verify"];
            const currentIndex = stepMap.indexOf(existingStep);
            const isActive = stepIndex === currentIndex;
            const isDone = stepIndex < currentIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className={`h-px w-6 ${isDone ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"}`} />}
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${isDone ? "bg-emerald-500 text-white" : isActive ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"}`}>
                  {isDone ? <Check className="h-3.5 w-3.5" /> : stepIndex + 1}
                </div>
                <span className={`text-xs font-medium ${isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>{label}</span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/60 p-3.5 dark:border-red-800/40 dark:bg-red-900/10">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /><p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Step 1: Enter domain */}
        {existingStep === "enter" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-sky-200/60 bg-gradient-to-br from-sky-50/80 to-cyan-50/60 p-6 dark:border-sky-800/40 dark:from-sky-900/20 dark:to-cyan-900/10">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15"><Link2 className="h-5 w-5 text-sky-600 dark:text-sky-400" /></div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">What&apos;s your domain?</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Enter the domain you&apos;d like to connect. This is usually your church or organization&apos;s website address.</p>
                </div>
              </div>
              <form onSubmit={handleConnectDomain} className="mt-5 flex gap-2">
                <input type="text" value={domainInput} onChange={e => setDomainInput(e.target.value)} placeholder="www.yourchurch.org" className="flex-1 rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:border-sky-800 dark:bg-slate-800 dark:text-slate-100" />
                <button type="submit" disabled={adding} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-sky-700 disabled:opacity-50">
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Continue
                </button>
              </form>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-slate-50/60 p-3 dark:bg-slate-800/30">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">Use the full domain including &ldquo;www&rdquo; if that&apos;s how your site is accessed. Examples: <span className="font-mono text-slate-700 dark:text-slate-300">www.gracechurch.org</span>, <span className="font-mono text-slate-700 dark:text-slate-300">give.mychurch.com</span></p>
            </div>
          </div>
        )}

        {/* Step 2: DNS Instructions */}
        {existingStep === "instructions" && instructions && (
          <div className="space-y-5">
            {/* ACM SSL validation records (CloudFront only) */}
            {acmRecords.length > 0 && (
              <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-purple-50/60 p-6 dark:border-violet-800/40 dark:from-violet-900/20 dark:to-purple-900/10">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15"><Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" /></div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Step 1: SSL Certificate Validation</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Add this CNAME record at your domain registrar to verify your SSL certificate. This enables HTTPS for your site.</p>
                  </div>
                </div>

                {acmRecords.map((rec, idx) => {
                  const isValidated = rec.status === "SUCCESS";
                  return (
                    <div key={idx} className={`mt-4 overflow-hidden rounded-xl border shadow-sm ${isValidated ? "border-emerald-300/50 dark:border-emerald-700/40" : "border-violet-300/50 dark:border-violet-700/40"} bg-white dark:bg-slate-800/80`}>
                      <div className={`flex items-center justify-between border-b px-4 py-2.5 ${isValidated ? "border-emerald-100 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-900/20" : "border-violet-100 bg-violet-50/50 dark:border-violet-800/40 dark:bg-violet-900/20"}`}>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isValidated ? "text-emerald-600 dark:text-emerald-400" : "text-violet-600 dark:text-violet-400"}`}>
                          {rec.domain ? `SSL Record for ${rec.domain}` : "SSL Validation Record"}
                        </span>
                        {isValidated && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle className="h-3 w-3" /> Validated</span>}
                        {!isValidated && rec.status && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">Pending</span>}
                      </div>
                      {!isValidated && (
                        <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                          {[
                            { label: "Type", value: rec.type },
                            { label: "Name / Host", value: rec.name },
                            { label: "Value / Points to", value: rec.value },
                            { label: "TTL", value: "300 (or Auto)" },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between px-4 py-3">
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{row.label}</span>
                              <div className="flex items-center gap-2">
                                <code className="max-w-[260px] truncate rounded-md bg-slate-50 px-2.5 py-1 text-xs font-mono font-semibold text-slate-900 dark:bg-slate-700/60 dark:text-slate-100">{row.value}</code>
                                <button type="button" onClick={() => handleCopy(row.value)} className="rounded-md p-1 text-slate-400 transition-colors hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/30 dark:hover:text-violet-400">
                                  {copiedText === row.value ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Main DNS Record */}
            <div className="rounded-2xl border border-sky-200/60 bg-gradient-to-br from-sky-50/80 to-cyan-50/60 p-6 dark:border-sky-800/40 dark:from-sky-900/20 dark:to-cyan-900/10">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15"><BookOpen className="h-5 w-5 text-sky-600 dark:text-sky-400" /></div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{acmRecords.length > 0 ? "Step 2: Point your domain" : "Add this DNS record"}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {acmRecords.length > 0
                      ? "Add this record to point your domain to your hosted site:"
                      : "Log in to your domain registrar (where you bought the domain) and add the following record:"}
                  </p>
                </div>
              </div>

              {/* DNS Record Card */}
              <div className="mt-5 overflow-hidden rounded-xl border border-sky-300/50 bg-white shadow-sm dark:border-sky-700/40 dark:bg-slate-800/80">
                <div className="border-b border-sky-100 bg-sky-50/50 px-4 py-2.5 dark:border-sky-800/40 dark:bg-sky-900/20">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">Required DNS Record</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                  {[
                    { label: "Type", value: instructions.type || (instructions.name === "@" ? "A" : "CNAME") },
                    { label: "Name / Host", value: instructions.name === "@" ? "@ (root)" : instructions.name },
                    { label: "Value / Points to", value: instructions.value },
                    { label: "TTL", value: "300 (or Auto)" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{row.label}</span>
                      <div className="flex items-center gap-2">
                        <code className="rounded-md bg-slate-50 px-2.5 py-1 text-sm font-mono font-semibold text-slate-900 dark:bg-slate-700/60 dark:text-slate-100">{row.value}</code>
                        <button type="button" onClick={() => handleCopy(row.value)} className="rounded-md p-1 text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-900/30 dark:hover:text-sky-400">
                          {copiedText === row.value ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Root domain note for CloudFront */}
              {acmRecords.length > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50/60 p-3 dark:bg-amber-900/10">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>Root domain tip:</strong> Most registrars (GoDaddy, Namecheap) don&apos;t allow CNAME on the root domain (@). Use <code className="font-mono text-amber-800 dark:text-amber-300">www</code> for your CNAME, then set up a redirect from your root domain to <code className="font-mono text-amber-800 dark:text-amber-300">www</code> in your registrar&apos;s settings.
                  </p>
                </div>
              )}
            </div>

            {/* Registrar guides */}
            <div className="rounded-xl border border-slate-200/60 bg-slate-50/40 p-4 dark:border-slate-700/40 dark:bg-slate-800/30">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Where did you buy your domain?</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(REGISTRAR_GUIDES).map(([key, guide]) => (
                  <a key={key} href={guide.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 rounded-lg border border-slate-200/60 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-all hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-700 dark:border-slate-700/40 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-sky-600 dark:hover:text-sky-400">
                    {guide.name}
                    <ExternalLink className="h-2.5 w-2.5 opacity-40 group-hover:opacity-80" />
                  </a>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button type="button" onClick={() => setExistingStep("enter")} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button type="button" onClick={handleVerifyDomain} disabled={verifying} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-sky-700 disabled:opacity-50">
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {verifying ? "Checking DNS..." : "I've added the records — verify now"}
              </button>
            </div>

            {/* Verify result (inline) */}
            {verifyResult && verifyResult.verified && existingStep === "instructions" && (
              <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-800/40 dark:bg-sky-900/10">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                <div>
                  <p className="text-sm font-medium text-sky-800 dark:text-sky-300">DNS Verified!</p>
                  <p className="mt-0.5 text-xs text-sky-700 dark:text-sky-400">{verifyResult.message}</p>
                </div>
              </div>
            )}
            {verifyResult && !verifyResult.verified && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800/40 dark:bg-amber-900/10">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Not verified yet</p>
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">{verifyResult.message}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Success */}
        {existingStep === "verify" && verifyResult?.verified && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-teal-50/60 p-8 text-center dark:border-emerald-800/40 dark:from-emerald-900/20 dark:to-teal-900/10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Domain connected!</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your domain is now verified and pointing to your Give site. Visitors will see your content at your custom domain.</p>
            </div>
            <button type="button" onClick={() => { setPath(null); setExistingStep("enter"); setInstructions(null); setVerifyResult(null); }} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
              <Check className="h-4 w-4" /> Done
            </button>
          </div>
        )}
      </div>
    );
  }

  // === PATH B: PURCHASE DOMAIN ===
  if (path === "purchase") {
    const isFallback = searchNote !== null;
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => { setPath(null); setSearchQuery(""); setSearchResults([]); setSearched(false); setError(null); }} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to options
        </button>

        <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-teal-50/60 p-6 dark:border-emerald-800/40 dark:from-emerald-900/20 dark:to-teal-900/10">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15"><Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Find the perfect domain</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Search for a domain name that represents your organization. We&apos;ll check .com, .org, .net, .church, and more.</p>
            </div>
          </div>

          <form onSubmit={e => { e.preventDefault(); if (searchQuery.trim().length >= 2) doSearch(searchQuery.trim()); }} className="relative mt-5">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchQuery} onChange={e => handleSearchInput(e.target.value)} placeholder="yourchurch" className="w-full rounded-xl border border-emerald-200 bg-white py-3.5 pl-11 pr-28 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 dark:border-emerald-800 dark:bg-slate-800 dark:text-slate-100" />
            <button type="submit" disabled={searching || searchQuery.trim().length < 2} className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40">
              {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>
        )}

        {/* Available results */}
        {searched && availableResults.length > 0 && !isFallback && (
          <div className="space-y-2">
            <div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-emerald-500" /><span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Available domains</span></div>
            <div className="space-y-1.5">
              {availableResults.map(r => (
                <div key={r.domain} className="group flex items-center justify-between gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/40 px-4 py-3 transition-all hover:border-emerald-300 hover:shadow-sm dark:border-emerald-800/40 dark:bg-emerald-900/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10"><Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{r.domain}</p>
                      {r.price > 0 && <p className="text-xs text-slate-500">{formatPrice(r.price, r.currency)}/yr</p>}
                    </div>
                  </div>
                  <a href={`https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(r.domain)}`} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 group-hover:shadow-md">
                    <ShoppingCart className="h-3 w-3" /> Get domain <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                  </a>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-sky-50/60 p-3 dark:bg-sky-900/10">
              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
              <p className="text-xs text-sky-700 dark:text-sky-400">After purchasing, come back here and choose <strong>&ldquo;I already have a domain&rdquo;</strong> to connect it.</p>
            </div>
          </div>
        )}

        {/* No results */}
        {searched && availableResults.length === 0 && !isFallback && !error && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 p-6 text-center dark:border-slate-700">
            <Globe className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-500">No available domains found for &ldquo;{searchQuery}&rdquo;</p>
            <p className="mt-1 text-xs text-slate-400">Try a different name or variation</p>
          </div>
        )}

        {/* Fallback — suggestions */}
        {searched && isFallback && searchResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl border border-blue-200/60 bg-blue-50/40 p-3 dark:border-blue-800/40 dark:bg-blue-900/10">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
              <p className="text-xs text-blue-700 dark:text-blue-400">Showing domain suggestions. Click any to check availability and purchase.</p>
            </div>
            <div className="space-y-1.5">
              {searchResults.map(r => (
                <a key={r.domain} href={`https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(r.domain)}`} target="_blank" rel="noopener noreferrer" className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/60 bg-white px-4 py-3 transition-all hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-slate-700/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <Globe className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
                    <p className="truncate text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300">{r.domain}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-emerald-600">Check availability <ExternalLink className="h-3 w-3" /></span>
                </a>
              ))}
            </div>
          </div>
        )}

        {!searched && !searching && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 p-5 text-center dark:border-slate-700">
            <Globe className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-500">Enter a name above to start searching</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

