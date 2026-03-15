"use client";

import { useState, useMemo } from "react";
import {
  User, Mail, Phone, MapPin, Heart, Users, Sparkles,
  CheckCircle2, ChevronRight, ChevronLeft, Send, Loader2,
  Church,
} from "lucide-react";
import type { ConnectCardSettings, MinistryOption } from "@/app/dashboard/connect-card/page";

type Props = {
  orgSlug: string;
  orgId?: string;
  orgName: string;
  orgDescription: string | null;
  orgLogo: string | null;
  orgCity: string | null;
  orgState: string | null;
  settings: ConnectCardSettings | null;
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  visitType: string;
  marital: string;
  birthday: string;
  children: string;
  ministries: string[];
  howHeard: string;
  prayer: string;
};

const VISIT_TYPES = [
  { value: "first_time", label: "First-time visitor", icon: "\uD83D\uDC4B" },
  { value: "regular",    label: "Regular attender",   icon: "\uD83D\uDE4F" },
  { value: "new_member", label: "New member",         icon: "\u2B50" },
  { value: "online",     label: "Online viewer",      icon: "\uD83D\uDCBB" },
];

const MARITAL_STATUS = [
  "Single", "Married", "Engaged", "Divorced", "Widowed", "Prefer not to say",
];

const DEFAULT_MINISTRY_OPTIONS: MinistryOption[] = [
  { value: "worship",      label: "Worship",      icon: "\uD83C\uDFB5" },
  { value: "youth",        label: "Youth",        icon: "\uD83C\uDF1F" },
  { value: "kids",         label: "Kids",         icon: "\uD83E\uDDD2" },
  { value: "hospitality",  label: "Hospitality",  icon: "\u2615" },
  { value: "outreach",     label: "Outreach",     icon: "\uD83C\uDF0D" },
  { value: "prayer",       label: "Prayer",       icon: "\uD83D\uDE4F" },
  { value: "small_groups", label: "Small Groups",  icon: "\uD83D\uDC65" },
  { value: "media_tech",   label: "Media & Tech",  icon: "\uD83C\uDFAC" },
  { value: "volunteers",   label: "Volunteers",    icon: "\uD83E\uDD1D" },
  { value: "missions",     label: "Missions",      icon: "\u2708\uFE0F" },
];

const HOW_HEARD = [
  "Friend or family", "Social media", "Google search", "Drove by", "Online ad",
  "Local event", "Other",
];

const EMPTY: FormData = {
  firstName: "", lastName: "", email: "", phone: "",
  address: "", city: "", state: "", zip: "",
  visitType: "", marital: "", birthday: "", children: "",
  ministries: [], howHeard: "", prayer: "",
};

function hexToRgb(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "16,185,129";
  return `${r},${g},${b}`;
}

export function ConnectCardForm({ orgSlug, orgId, orgName, orgDescription, orgLogo, orgCity, orgState, settings }: Props) {
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState<FormData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const pc = settings?.primary_color ?? "#10b981";
  const pcRgb = useMemo(() => hexToRgb(pc), [pc]);
  const hidden = useMemo(() => new Set(settings?.hidden_fields ?? []), [settings?.hidden_fields]);
  const ministryOpts = settings?.ministry_options?.length ? settings.ministry_options : DEFAULT_MINISTRY_OPTIONS;
  const welcomeHeadline = settings?.welcome_headline || "";
  const welcomeSubtext = settings?.welcome_subtext || "";

  const STEPS = useMemo(() => {
    const steps = [{ id: 0, label: "You", icon: User }];
    if (!hidden.has("address")) steps.push({ id: steps.length, label: "Location", icon: MapPin });
    const hasAboutFields = !hidden.has("visit_type") || !hidden.has("marital_status") || !hidden.has("children");
    if (hasAboutFields) steps.push({ id: steps.length, label: "About", icon: Heart });
    steps.push({ id: steps.length, label: "Connect", icon: Sparkles });
    return steps;
  }, [hidden]);

  const stepLabels = useMemo(() => STEPS.map((s) => s.label), [STEPS]);

  const set = (field: keyof FormData, val: string) =>
    setForm((f) => ({ ...f, [field]: val }));

  const toggleMinistry = (val: string) =>
    setForm((f) => ({
      ...f,
      ministries: f.ministries.includes(val)
        ? f.ministries.filter((m) => m !== val)
        : [...f.ministries, val],
    }));

  const canAdvance = () => {
    if (stepLabels[step] === "You") return form.firstName.trim() !== "" && form.email.trim() !== "";
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/connect-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgSlug, orgId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg border border-gray-100">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full p-5" style={{ backgroundColor: `rgba(${pcRgb},0.1)` }}>
              <CheckCircle2 className="h-12 w-12" style={{ color: pc }} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re connected!</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Thanks for reaching out{form.firstName ? `, ${form.firstName}` : ""}! Someone from <strong>{orgName}</strong> will be in touch with you soon.
          </p>
          <div className="mt-6 h-1 w-16 mx-auto rounded-full" style={{ backgroundColor: `rgba(${pcRgb},0.3)` }} />
        </div>
        <p className="mt-6 text-xs text-gray-400">Powered by Exchange</p>
      </div>
    );
  }

  const locationStr = [orgCity, orgState].filter(Boolean).join(", ");
  const currentStepLabel = stepLabels[step];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── Colored header strip ── */}
      <div className="px-4 pt-8 pb-12 text-center" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}>
        {orgLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={orgLogo} alt={orgName} className="mx-auto mb-3 h-14 w-14 rounded-2xl object-cover shadow-lg ring-2 ring-white/20" />
        ) : (
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-lg">
            <Church className="h-7 w-7 text-white" />
          </div>
        )}
        <h1 className="text-xl font-bold text-white">{orgName}</h1>
        {locationStr && <p className="mt-0.5 text-sm text-white/70">{locationStr}</p>}
        {(welcomeHeadline || orgDescription) && (
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/80">
            {welcomeHeadline || (orgDescription && orgDescription.length > 100 ? orgDescription.slice(0, 100) + "\u2026" : orgDescription)}
          </p>
        )}
        {welcomeSubtext && (
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-white/60">{welcomeSubtext}</p>
        )}
      </div>

      {/* ── Card (overlaps the header) ── */}
      <div className="flex-1 px-4 pb-8 -mt-6">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl bg-white border border-gray-200 shadow-lg overflow-hidden">

            {/* ── Step progress bar ── */}
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const active = step === i;
                  const done   = step > i;
                  return (
                    <div key={s.id} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300"
                          style={
                            done
                              ? { backgroundColor: pc, color: "white" }
                              : active
                                ? { backgroundColor: `rgba(${pcRgb},0.1)`, color: pc, boxShadow: `inset 0 0 0 2px ${pc}` }
                                : { backgroundColor: "#f3f4f6", color: "#9ca3af" }
                          }
                        >
                          {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                        </div>
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: active || done ? pc : "#9ca3af" }}
                        >
                          {s.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className="mx-2 mb-4 h-px flex-1 transition-all duration-300"
                          style={{ backgroundColor: done ? pc : "#e5e7eb" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Form content ── */}
            <div className="p-6">

              {/* Step: You */}
              {currentStepLabel === "You" && (
                <div className="space-y-5">
                  <StepHeading icon={<User className="h-5 w-5" style={{ color: pc }} />} title="Tell us about you" subtitle="Let&apos;s start with the basics." pc={pc} pcRgb={pcRgb} />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="First name *">
                      <input type="text" placeholder="Jane" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className="form-input" />
                    </FormField>
                    <FormField label="Last name">
                      <input type="text" placeholder="Smith" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className="form-input" />
                    </FormField>
                  </div>

                  <FormField label="Email address *" icon={<Mail className="h-4 w-4 text-gray-400" />}>
                    <input type="email" placeholder="jane@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} className="form-input" />
                  </FormField>

                  {!hidden.has("phone") && (
                    <FormField label="Phone number" icon={<Phone className="h-4 w-4 text-gray-400" />}>
                      <input type="tel" placeholder="(555) 000-0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="form-input" />
                    </FormField>
                  )}

                  {!hidden.has("birthday") && (
                    <FormField label="Birthday (optional)">
                      <input type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} className="form-input" />
                    </FormField>
                  )}
                </div>
              )}

              {/* Step: Location */}
              {currentStepLabel === "Location" && (
                <div className="space-y-5">
                  <StepHeading icon={<MapPin className="h-5 w-5" style={{ color: pc }} />} title="Where are you located?" subtitle="This helps us stay in touch with you." pc={pc} pcRgb={pcRgb} />

                  <FormField label="Street address" icon={<MapPin className="h-4 w-4 text-gray-400" />}>
                    <input type="text" placeholder="123 Main St" value={form.address} onChange={(e) => set("address", e.target.value)} className="form-input" />
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="City">
                      <input type="text" placeholder="Dallas" value={form.city} onChange={(e) => set("city", e.target.value)} className="form-input" />
                    </FormField>
                    <FormField label="State">
                      <input type="text" placeholder="TX" value={form.state} onChange={(e) => set("state", e.target.value)} className="form-input" maxLength={2} />
                    </FormField>
                  </div>

                  <FormField label="ZIP code">
                    <input type="text" placeholder="75001" value={form.zip} onChange={(e) => set("zip", e.target.value)} className="form-input" maxLength={10} />
                  </FormField>
                </div>
              )}

              {/* Step: About */}
              {currentStepLabel === "About" && (
                <div className="space-y-6">
                  <StepHeading icon={<Heart className="h-5 w-5" style={{ color: pc }} />} title="A little more about you" subtitle="Helps us get to know you better." pc={pc} pcRgb={pcRgb} />

                  {!hidden.has("visit_type") && (
                    <div>
                      <label className="form-label">I am a&hellip;</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {VISIT_TYPES.map((v) => {
                          const active = form.visitType === v.value;
                          return (
                            <button
                              key={v.value}
                              type="button"
                              onClick={() => set("visitType", v.value)}
                              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                                active ? "border-transparent" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                              style={active ? { borderColor: pc, backgroundColor: `rgba(${pcRgb},0.08)`, color: pc } : undefined}
                            >
                              <span className="text-base">{v.icon}</span>
                              <span>{v.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!hidden.has("marital_status") && (
                    <div>
                      <label className="form-label">Marital status</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {MARITAL_STATUS.map((m) => {
                          const active = form.marital === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => set("marital", m)}
                              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                                active ? "" : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                              style={active ? { borderColor: pc, backgroundColor: `rgba(${pcRgb},0.08)`, color: pc } : undefined}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!hidden.has("children") && (
                    <FormField label="Number of children (optional)" icon={<Users className="h-4 w-4 text-gray-400" />}>
                      <input type="number" placeholder="0" min={0} max={20} value={form.children} onChange={(e) => set("children", e.target.value)} className="form-input" />
                    </FormField>
                  )}
                </div>
              )}

              {/* Step: Connect */}
              {currentStepLabel === "Connect" && (
                <div className="space-y-6">
                  <StepHeading icon={<Sparkles className="h-5 w-5" style={{ color: pc }} />} title="Get connected" subtitle="Tell us where you&apos;d love to plug in." pc={pc} pcRgb={pcRgb} />

                  <div>
                    <label className="form-label">Ministry interests <span className="text-gray-400 font-normal">(select all that apply)</span></label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {ministryOpts.map((m) => {
                        const active = form.ministries.includes(m.value);
                        return (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => toggleMinistry(m.value)}
                            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                              active ? "" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            style={active ? { borderColor: pc, backgroundColor: `rgba(${pcRgb},0.08)`, color: pc } : undefined}
                          >
                            <span className="text-base">{m.icon}</span>
                            <span className="flex-1">{m.label}</span>
                            {active && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: pc }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {!hidden.has("how_heard") && (
                    <div>
                      <label className="form-label">How did you hear about us?</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {HOW_HEARD.map((h) => {
                          const active = form.howHeard === h;
                          return (
                            <button
                              key={h}
                              type="button"
                              onClick={() => set("howHeard", h)}
                              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                                active ? "" : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                              style={active ? { borderColor: pc, backgroundColor: `rgba(${pcRgb},0.08)`, color: pc } : undefined}
                            >
                              {h}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!hidden.has("prayer") && (
                    <FormField label="Prayer request or anything you'd like us to know">
                      <textarea
                        placeholder="Share anything on your heart\u2026"
                        rows={4}
                        value={form.prayer}
                        onChange={(e) => set("prayer", e.target.value)}
                        className="form-input resize-none"
                      />
                    </FormField>
                  )}

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Navigation buttons ── */}
            <div className="border-t border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                )}

                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => { if (canAdvance()) setStep((s) => s + 1); }}
                    disabled={!canAdvance()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ backgroundColor: pc }}
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: pc }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting&hellip;
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit
                      </>
                    )}
                  </button>
                )}
              </div>
              <p className="mt-3 text-center text-xs text-gray-400">
                Step {step + 1} of {STEPS.length}
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">Powered by Exchange</p>
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function StepHeading({ icon, title, subtitle, pc, pcRgb }: { icon: React.ReactNode; title: string; subtitle: string; pc: string; pcRgb: string }) {
  return (
    <div className="flex items-start gap-3 pb-2">
      <div className="mt-0.5 rounded-lg p-1.5" style={{ backgroundColor: `rgba(${pcRgb},0.1)` }}>{icon}</div>
      <div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="form-label">
        {icon && <span className="mr-1.5 inline-flex align-middle">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}
