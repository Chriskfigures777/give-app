"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, TrendingUp, Heart, FileText, ClipboardList,
  UserCircle, UserPlus, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ContactRow = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  source: string;
  sources_breakdown: Record<string, number>;
  first_seen_at: string;
  last_seen_at: string;
};

type Tab = "all" | "givers" | "members" | "form" | "survey" | "manual";

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-400",
  "bg-violet-500/20 text-violet-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-orange-500/20 text-orange-400",
  "bg-rose-500/20 text-rose-400",
  "bg-teal-500/20 text-teal-400",
];

function avatarColor(id: string) {
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initials(name: string | null, email: string | null) {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

function getSourceTags(source: string, breakdown: Record<string, number>) {
  const tags: { label: string; color: string; icon: React.ReactNode }[] = [];
  if ((breakdown.donation ?? 0) > 0)
    tags.push({ label: "Giver", color: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20", icon: <Heart className="h-2.5 w-2.5" /> });
  if ((breakdown.member ?? 0) > 0)
    tags.push({ label: "Member", color: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20", icon: <UserCircle className="h-2.5 w-2.5" /> });
  if ((breakdown.get_started ?? 0) > 0)
    tags.push({ label: "Get started", color: "bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/20", icon: <TrendingUp className="h-2.5 w-2.5" /> });
  if ((breakdown.form ?? 0) > 0 && tags.length === 0)
    tags.push({ label: "Form", color: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20", icon: <FileText className="h-2.5 w-2.5" /> });
  if ((breakdown.survey ?? 0) > 0)
    tags.push({ label: "Survey", color: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/20", icon: <ClipboardList className="h-2.5 w-2.5" /> });
  if (source === "manual" || (breakdown.manual ?? 0) > 0)
    tags.push({ label: "Manual", color: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20", icon: <UserPlus className="h-2.5 w-2.5" /> });
  if (tags.length === 0)
    tags.push({ label: source, color: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20", icon: <Users className="h-2.5 w-2.5" /> });
  return tags;
}

function filterContacts(contacts: ContactRow[], tab: Tab) {
  if (tab === "all") return contacts;
  return contacts.filter((c) => {
    const b = c.sources_breakdown ?? {};
    if (tab === "givers") return (b.donation ?? 0) > 0;
    if (tab === "members") return (b.member ?? 0) > 0 || (b.get_started ?? 0) > 0;
    if (tab === "form") return (b.form ?? 0) > 0;
    if (tab === "survey") return (b.survey ?? 0) > 0;
    if (tab === "manual") return c.source === "manual" || (b.manual ?? 0) > 0;
    return true;
  });
}

export function PeoplePageClient({ contacts }: { contacts: ContactRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const totalDonors = contacts.filter((c) => (c.sources_breakdown?.donation ?? 0) > 0).length;
  const totalMembers = contacts.filter((c) => (c.sources_breakdown?.member ?? 0) > 0 || (c.sources_breakdown?.get_started ?? 0) > 0).length;
  const totalForm = contacts.filter((c) => (c.sources_breakdown?.form ?? 0) > 0).length;
  const totalSurvey = contacts.filter((c) => (c.sources_breakdown?.survey ?? 0) > 0).length;
  const totalManual = contacts.filter((c) => c.source === "manual" || (c.sources_breakdown?.manual ?? 0) > 0).length;

  const tabs: { id: Tab; label: string; count: number; icon: React.ReactNode; color: string }[] = [
    { id: "all", label: "All", count: contacts.length, icon: <Users className="h-3.5 w-3.5" />, color: "text-dashboard-text" },
    { id: "givers", label: "Givers", count: totalDonors, icon: <Heart className="h-3.5 w-3.5" />, color: "text-blue-400" },
    { id: "members", label: "Members", count: totalMembers, icon: <UserCircle className="h-3.5 w-3.5" />, color: "text-emerald-400" },
    { id: "form", label: "Form", count: totalForm, icon: <FileText className="h-3.5 w-3.5" />, color: "text-violet-400" },
    { id: "survey", label: "Survey", count: totalSurvey, icon: <ClipboardList className="h-3.5 w-3.5" />, color: "text-orange-400" },
    { id: "manual", label: "Added manually", count: totalManual, icon: <UserPlus className="h-3.5 w-3.5" />, color: "text-slate-400" },
  ];

  const visible = filterContacts(contacts, tab);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    if (!form.name.trim() && !form.email.trim()) {
      setAddError("Enter at least a name or email.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/organization-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setAddError(data.error ?? "Failed to add contact"); return; }
      setShowAdd(false);
      setForm({ name: "", email: "", phone: "" });
      router.refresh();
    } catch {
      setAddError("Something went wrong.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-5 p-3 sm:p-5">
      {/* Header */}
      <div className="dashboard-fade-in flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-dashboard-text">People</h1>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Everyone connected to your organization — givers, members, form submitters, and more.
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="shrink-0 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <UserPlus className="h-4 w-4" /> Add person
        </Button>
      </div>

      {/* Stats row */}
      <div className="dashboard-fade-in-delay-1 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "rounded-xl border p-4 text-left transition-all shadow-sm",
              tab === t.id
                ? "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                : "border-dashboard-border bg-dashboard-card hover:border-dashboard-border/80 hover:bg-dashboard-card-hover",
            ].join(" ")}
          >
            <div className={`mb-2 inline-flex rounded-lg p-1.5 ${tab === t.id ? "bg-emerald-500/15" : "bg-dashboard-card-hover"} ${t.color}`}>
              {t.icon}
            </div>
            <p className={`text-2xl font-bold tabular-nums ${t.color}`}>{t.count}</p>
            <p className="mt-0.5 text-xs text-dashboard-text-muted">{t.label}</p>
          </button>
        ))}
      </div>

      {/* Contact table */}
      <div className="dashboard-fade-in-delay-2 rounded-2xl border border-dashboard-border bg-dashboard-card overflow-hidden shadow-sm">
        <div className="border-b border-dashboard-border px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-dashboard-text">
            {tabs.find((t) => t.id === tab)?.label ?? "All"} contacts
          </h2>
          <span className="rounded-full bg-dashboard-card-hover px-2.5 py-0.5 text-xs text-dashboard-text-muted">
            {visible.length} {visible.length === 1 ? "person" : "people"}
          </span>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="mb-4 rounded-2xl bg-violet-500/10 p-4">
              <Users className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="text-base font-semibold text-dashboard-text">
              {contacts.length === 0 ? "No contacts yet" : "No contacts in this category"}
            </h3>
            <p className="mt-1.5 max-w-xs text-sm text-dashboard-text-muted">
              {contacts.length === 0
                ? "Add someone manually or contacts will appear when someone gives or submits a form."
                : "Try a different category or add someone manually."}
            </p>
            <Button onClick={() => setShowAdd(true)} className="mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
              <UserPlus className="h-4 w-4" /> Add person
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dashboard-border bg-dashboard-card-hover/30">
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Name</th>
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Email</th>
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted hidden sm:table-cell">Phone</th>
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted">Groups</th>
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-dashboard-text-muted hidden md:table-cell">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const tags = getSourceTags(c.source, c.sources_breakdown ?? {});
                  const init = initials(c.name, c.email);
                  const aColor = avatarColor(c.id);
                  return (
                    <tr key={c.id} className="border-t border-dashboard-border transition-colors hover:bg-dashboard-card-hover/40">
                      <td className="p-3">
                        <Link href={`/dashboard/people/${c.id}`} className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${aColor}`}>
                            {init}
                          </div>
                          <span className="font-medium text-dashboard-text hover:underline">
                            {c.name?.trim() || <span className="text-dashboard-text-muted italic">No name</span>}
                          </span>
                        </Link>
                      </td>
                      <td className="p-3 text-dashboard-text-muted">
                        <Link href={`/dashboard/people/${c.id}`} className="hover:underline">{c.email ?? "—"}</Link>
                      </td>
                      <td className="p-3 text-dashboard-text-muted hidden sm:table-cell">{c.phone?.trim() || "—"}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {tags.map((t) => (
                            <span key={t.label} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.color}`}>
                              {t.icon}{t.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-dashboard-text-muted hidden md:table-cell">
                        {c.last_seen_at
                          ? new Date(c.last_seen_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add person modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-dashboard-border bg-dashboard-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-dashboard-border px-6 py-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-semibold text-dashboard-text">Add person</h2>
              </div>
              <button onClick={() => { setShowAdd(false); setAddError(null); }} className="rounded p-1 text-dashboard-text-muted hover:text-dashboard-text transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-dashboard-text">Full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="John Smith"
                  className="w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-dashboard-text">Email address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-dashboard-text">Phone <span className="text-dashboard-text-muted font-normal">(optional)</span></label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-lg border border-dashboard-border bg-dashboard-card-hover px-3 py-2 text-sm text-dashboard-text placeholder:text-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              {addError && <p className="text-sm text-rose-400">{addError}</p>}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" onClick={() => { setShowAdd(false); setAddError(null); }} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={adding} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                  {adding ? "Adding…" : "Add person"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
