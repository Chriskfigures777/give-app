"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Server,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  X,
  Eye,
  HelpCircle,
  Info,
  Shield,
  Pencil,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

type HostedZoneInfo = { id: string; name: string; recordCount: number };
type DnsRecord = { name: string; type: string; ttl: number; values: string[] };

type RecordTypeId = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "CAA";

type FieldDef = {
  key: string;
  label: string;
  placeholder: string;
  hint?: string;
  type?: "text" | "number" | "textarea";
  required?: boolean;
  width?: "full" | "half" | "third";
  validate?: (v: string) => string | null;
};

type RecordTypeMeta = {
  id: RecordTypeId;
  label: string;
  description: string;
  color: string;
  fields: FieldDef[];
  buildValues: (fields: Record<string, string>) => string[];
};

/* ─────────────────────────────────────────────
   Validation helpers
   ───────────────────────────────────────────── */

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
const HOSTNAME_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.?$/;

function validateIpv4(v: string): string | null {
  if (!v) return "IP address is required";
  if (!IPV4_RE.test(v)) return "Enter a valid IPv4 address (e.g. 192.0.2.1)";
  const octets = v.split(".").map(Number);
  if (octets.some((o) => o > 255)) return "Each octet must be 0-255";
  return null;
}

function validateIpv6(v: string): string | null {
  if (!v) return "IPv6 address is required";
  if (!IPV6_RE.test(v) && !v.includes("::"))
    return "Enter a valid IPv6 address (e.g. 2001:db8::1)";
  return null;
}

function validateHostname(v: string): string | null {
  if (!v) return "Hostname is required";
  if (!HOSTNAME_RE.test(v)) return "Enter a valid hostname (e.g. mail.example.com)";
  return null;
}

function validatePort(v: string): string | null {
  if (!v) return "Port is required";
  const n = parseInt(v, 10);
  if (isNaN(n) || n < 0 || n > 65535) return "Port must be 0-65535";
  return null;
}

function validatePriority(v: string): string | null {
  if (!v) return "Priority is required";
  const n = parseInt(v, 10);
  if (isNaN(n) || n < 0 || n > 65535) return "Priority must be 0-65535";
  return null;
}

function validateWeight(v: string): string | null {
  if (!v) return "Weight is required";
  const n = parseInt(v, 10);
  if (isNaN(n) || n < 0 || n > 65535) return "Weight must be 0-65535";
  return null;
}

function validateRequired(label: string) {
  return (v: string): string | null => (v.trim() ? null : `${label} is required`);
}

/* ─────────────────────────────────────────────
   Record type definitions
   ───────────────────────────────────────────── */

const RECORD_TYPES: RecordTypeMeta[] = [
  {
    id: "A",
    label: "A",
    description: "Points a domain to an IPv4 address",
    color: "sky",
    fields: [
      { key: "name", label: "Name / Host", placeholder: "@ or subdomain", hint: "Use @ for root domain, or a subdomain like www", required: true, width: "full", validate: validateRequired("Name") },
      { key: "ip", label: "IPv4 Address", placeholder: "192.0.2.1", hint: "The IP address your domain should point to", required: true, width: "half", validate: validateIpv4 },
      { key: "ttl", label: "TTL (seconds)", placeholder: "300", hint: "Time to live — how long DNS caches this record", type: "number", width: "half" },
    ],
    buildValues: (f) => [f.ip],
  },
  {
    id: "AAAA",
    label: "AAAA",
    description: "Points a domain to an IPv6 address",
    color: "violet",
    fields: [
      { key: "name", label: "Name / Host", placeholder: "@ or subdomain", hint: "Use @ for root domain, or a subdomain", required: true, width: "full", validate: validateRequired("Name") },
      { key: "ip", label: "IPv6 Address", placeholder: "2001:0db8::1", hint: "The IPv6 address your domain should point to", required: true, width: "half", validate: validateIpv6 },
      { key: "ttl", label: "TTL (seconds)", placeholder: "300", type: "number", width: "half" },
    ],
    buildValues: (f) => [f.ip],
  },
  {
    id: "CNAME",
    label: "CNAME",
    description: "Aliases one domain to another",
    color: "emerald",
    fields: [
      { key: "name", label: "Name / Host", placeholder: "www", hint: "The subdomain to create an alias for (e.g. www, blog)", required: true, width: "full", validate: validateRequired("Name") },
      { key: "target", label: "Target / Points to", placeholder: "example.com", hint: "The canonical name this alias resolves to", required: true, width: "half", validate: validateHostname },
      { key: "ttl", label: "TTL (seconds)", placeholder: "300", type: "number", width: "half" },
    ],
    buildValues: (f) => [f.target],
  },
  {
    id: "MX",
    label: "MX",
    description: "Directs email to a mail server",
    color: "amber",
    fields: [
      { key: "name", label: "Name / Host", placeholder: "@", hint: "Usually @ for root domain email routing", required: true, width: "full", validate: validateRequired("Name") },
      { key: "priority", label: "Priority", placeholder: "10", hint: "Lower number = higher priority. Typical: 10, 20, 30", type: "number", required: true, width: "third", validate: validatePriority },
      { key: "server", label: "Mail Server", placeholder: "mail.example.com", hint: "The mail server hostname (must be a domain, not an IP)", required: true, width: "third", validate: validateHostname },
      { key: "ttl", label: "TTL (seconds)", placeholder: "300", type: "number", width: "third" },
    ],
    buildValues: (f) => [`${f.priority} ${f.server}`],
  },
  {
    id: "TXT",
    label: "TXT",
    description: "Stores text data — used for SPF, DKIM, verification",
    color: "rose",
    fields: [
      { key: "name", label: "Name / Host", placeholder: "@", hint: "Typically @ for SPF/DKIM, or _dmarc for DMARC", required: true, width: "full", validate: validateRequired("Name") },
      { key: "value", label: "Text Value", placeholder: "v=spf1 include:_spf.google.com ~all", hint: "The full TXT record value. Quotes are added automatically.", type: "textarea", required: true, width: "full", validate: validateRequired("Text value") },
      { key: "ttl", label: "TTL (seconds)", placeholder: "300", type: "number", width: "half" },
    ],
    buildValues: (f) => {
      let val = f.value.trim();
      if (!val.startsWith('"')) val = `"${val}"`;
      return [val];
    },
  },
  {
    id: "NS",
    label: "NS",
    description: "Delegates a zone to a nameserver",
    color: "cyan",
    fields: [
      { key: "name", label: "Name / Host", placeholder: "subdomain.example.com", hint: "The zone or subdomain to delegate", required: true, width: "full", validate: validateRequired("Name") },
      { key: "nameserver", label: "Nameserver", placeholder: "ns1.example.com", hint: "The authoritative nameserver for this zone", required: true, width: "half", validate: validateHostname },
      { key: "ttl", label: "TTL (seconds)", placeholder: "172800", type: "number", width: "half" },
    ],
    buildValues: (f) => [f.nameserver],
  },
  {
    id: "SRV",
    label: "SRV",
    description: "Specifies a server for a service (e.g. SIP, XMPP)",
    color: "indigo",
    fields: [
      { key: "name", label: "Service Name", placeholder: "_sip._tcp.example.com", hint: "Format: _service._protocol.domain", required: true, width: "full", validate: validateRequired("Service name") },
      { key: "priority", label: "Priority", placeholder: "10", type: "number", required: true, width: "third", validate: validatePriority },
      { key: "weight", label: "Weight", placeholder: "60", hint: "Relative weight for records with same priority", type: "number", required: true, width: "third", validate: validateWeight },
      { key: "port", label: "Port", placeholder: "5060", type: "number", required: true, width: "third", validate: validatePort },
      { key: "target", label: "Target Server", placeholder: "sip.example.com", required: true, width: "half", validate: validateHostname },
      { key: "ttl", label: "TTL (seconds)", placeholder: "300", type: "number", width: "half" },
    ],
    buildValues: (f) => [`${f.priority} ${f.weight} ${f.port} ${f.target}`],
  },
  {
    id: "CAA",
    label: "CAA",
    description: "Specifies which CAs can issue certificates",
    color: "orange",
    fields: [
      { key: "name", label: "Name / Host", placeholder: "@", required: true, width: "full", validate: validateRequired("Name") },
      { key: "flags", label: "Flags", placeholder: "0", hint: "Usually 0. Set 128 for critical.", type: "number", required: true, width: "third" },
      { key: "tag", label: "Tag", placeholder: "issue", hint: "issue, issuewild, or iodef", required: true, width: "third", validate: validateRequired("Tag") },
      { key: "value", label: "Value", placeholder: "letsencrypt.org", hint: "The CA domain or mailto: for iodef", required: true, width: "third", validate: validateRequired("Value") },
      { key: "ttl", label: "TTL (seconds)", placeholder: "300", type: "number", width: "half" },
    ],
    buildValues: (f) => [`${f.flags} ${f.tag} "${f.value}"`],
  },
];

/* ─────────────────────────────────────────────
   Color map for record type badges
   ───────────────────────────────────────────── */
const TYPE_COLORS: Record<string, string> = {
  A: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  AAAA: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  CNAME: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  MX: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  TXT: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  NS: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  SRV: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  SOA: "bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300",
  CAA: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

/* ─────────────────────────────────────────────
   Shared styles
   ───────────────────────────────────────────── */
const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/20";

const inputErrorCls =
  "w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 dark:border-red-700 dark:bg-slate-800 dark:text-slate-100";

/* ─────────────────────────────────────────────
   Dynamic DNS Record Form
   ───────────────────────────────────────────── */

/**
 * Parse an existing DnsRecord back into form field values for editing.
 */
function parseRecordToFields(
  record: DnsRecord
): { type: RecordTypeId; fields: Record<string, string> } | null {
  const type = record.type as RecordTypeId;
  const meta = RECORD_TYPES.find((t) => t.id === type);
  if (!meta) return null;

  const fields: Record<string, string> = {
    name: record.name,
    ttl: String(record.ttl),
  };

  const rawValue = record.values[0] ?? "";

  switch (type) {
    case "A":
      fields.ip = rawValue;
      break;
    case "AAAA":
      fields.ip = rawValue;
      break;
    case "CNAME":
      fields.target = rawValue;
      break;
    case "MX": {
      const parts = rawValue.split(/\s+/, 2);
      fields.priority = parts[0] ?? "";
      fields.server = parts[1] ?? "";
      break;
    }
    case "TXT":
      fields.value = rawValue.replace(/^"|"$/g, "");
      break;
    case "NS":
      fields.nameserver = rawValue;
      break;
    case "SRV": {
      const parts = rawValue.split(/\s+/, 4);
      fields.priority = parts[0] ?? "";
      fields.weight = parts[1] ?? "";
      fields.port = parts[2] ?? "";
      fields.target = parts[3] ?? "";
      break;
    }
    case "CAA": {
      const match = rawValue.match(/^(\d+)\s+(\S+)\s+"?([^"]*)"?$/);
      if (match) {
        fields.flags = match[1];
        fields.tag = match[2];
        fields.value = match[3];
      }
      break;
    }
  }

  return { type, fields };
}

function DynamicDnsForm({
  onSubmit,
  onCancel,
  submitting,
  zoneName,
  editingRecord,
}: {
  onSubmit: (type: string, name: string, values: string[], ttl: number) => void;
  onCancel: () => void;
  submitting: boolean;
  zoneName: string;
  editingRecord?: DnsRecord | null;
}) {
  const parsed = editingRecord ? parseRecordToFields(editingRecord) : null;
  const [selectedType, setSelectedType] = useState<RecordTypeId>(parsed?.type ?? "A");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(parsed?.fields ?? {});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPreview, setShowPreview] = useState(false);
  const isEditing = !!editingRecord;

  const typeMeta = useMemo(
    () => RECORD_TYPES.find((t) => t.id === selectedType)!,
    [selectedType]
  );

  const handleTypeChange = (newType: RecordTypeId) => {
    setSelectedType(newType);
    setFieldValues({});
    setFieldErrors({});
    setTouched({});
    setShowPreview(false);
  };

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
    if (touched[key]) {
      const field = typeMeta.fields.find((f) => f.key === key);
      if (field?.validate) {
        const err = field.validate(value);
        setFieldErrors((prev) => {
          const next = { ...prev };
          if (err) next[key] = err;
          else delete next[key];
          return next;
        });
      }
    }
  };

  const handleBlur = (key: string) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const field = typeMeta.fields.find((f) => f.key === key);
    if (field?.validate) {
      const err = field.validate(fieldValues[key] ?? "");
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (err) next[key] = err;
        else delete next[key];
        return next;
      });
    }
  };

  const validateAll = (): boolean => {
    const errors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};
    for (const field of typeMeta.fields) {
      allTouched[field.key] = true;
      if (field.validate) {
        const err = field.validate(fieldValues[field.key] ?? "");
        if (err) errors[field.key] = err;
      } else if (field.required && !fieldValues[field.key]?.trim()) {
        errors[field.key] = `${field.label} is required`;
      }
    }
    setTouched(allTouched);
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    const name = fieldValues.name ?? "";
    const ttl = parseInt(fieldValues.ttl ?? "300", 10) || 300;
    const values = typeMeta.buildValues(fieldValues);
    onSubmit(selectedType, name, values, ttl);
  };

  const previewRecord = useMemo(() => {
    try {
      const name = fieldValues.name || "(name)";
      const ttl = fieldValues.ttl || "300";
      const values = typeMeta.buildValues(fieldValues);
      return `${name} ${ttl} IN ${selectedType} ${values.join(" ")}`;
    } catch {
      return null;
    }
  }, [fieldValues, typeMeta, selectedType]);

  const hasErrors = Object.keys(fieldErrors).length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-sky-200/80 bg-gradient-to-b from-sky-50/80 to-white shadow-sm dark:border-sky-800/40 dark:from-sky-900/10 dark:to-slate-800/60">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50/50 px-4 py-3 dark:border-sky-800/30 dark:bg-sky-900/15">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Pencil className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          ) : (
            <Plus className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          )}
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {isEditing ? "Edit DNS Record" : "Add DNS Record"}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {isEditing ? editingRecord?.name : `to ${zoneName}`}
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Record type selector */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Record Type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {RECORD_TYPES.map((rt) => {
              const isActive = rt.id === selectedType;
              const isLocked = isEditing && rt.id !== selectedType;
              return (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => !isEditing && handleTypeChange(rt.id)}
                  disabled={isLocked}
                  className={`group relative rounded-lg px-3 py-2 text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? isEditing
                        ? "bg-amber-600 text-white shadow-md shadow-amber-500/25 dark:bg-amber-500"
                        : "bg-sky-600 text-white shadow-md shadow-sky-500/25 dark:bg-sky-500"
                      : isLocked
                        ? "border border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-600"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:border-sky-600 dark:hover:text-sky-400"
                  }`}
                >
                  {rt.id}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-white/50" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Info className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
            {typeMeta.description}
          </p>
        </div>

        {/* Dynamic fields */}
        <div className="grid grid-cols-6 gap-3">
          {typeMeta.fields.map((field) => {
            const colSpan =
              field.width === "full"
                ? "col-span-6"
                : field.width === "half"
                  ? "col-span-6 sm:col-span-3"
                  : "col-span-6 sm:col-span-2";
            const error = touched[field.key] ? fieldErrors[field.key] : null;
            const value = fieldValues[field.key] ?? "";

            return (
              <div key={field.key} className={colSpan}>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {field.label}
                  {field.required && (
                    <span className="text-red-400">*</span>
                  )}
                  {field.hint && (
                    <span className="group relative">
                      <HelpCircle className="h-3 w-3 text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400" />
                      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-[10px] font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700">
                        {field.hint}
                        <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900 dark:bg-slate-700" />
                      </span>
                    </span>
                  )}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    value={value}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    onBlur={() => handleBlur(field.key)}
                    placeholder={field.placeholder}
                    rows={3}
                    className={error ? inputErrorCls : inputCls}
                  />
                ) : (
                  <input
                    type={field.type === "number" ? "number" : "text"}
                    value={value}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    onBlur={() => handleBlur(field.key)}
                    placeholder={field.placeholder}
                    min={field.type === "number" ? 0 : undefined}
                    className={error ? inputErrorCls : inputCls}
                  />
                )}
                {error && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Preview */}
        {previewRecord && (
          <div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              <Eye className="h-3 w-3" />
              {showPreview ? "Hide" : "Show"} record preview
            </button>
            {showPreview && (
              <div className="mt-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700/40 dark:bg-slate-800/40">
                <code className="block text-xs font-mono text-slate-700 dark:text-slate-300">
                  {previewRecord}
                </code>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-700/40">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Fields marked with <span className="text-red-400">*</span> are required
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || hasErrors}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow-md disabled:opacity-50 disabled:shadow-none dark:bg-sky-500 dark:hover:bg-sky-600"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {submitting ? "Saving..." : isEditing ? "Update Record" : "Add Record"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DNS Records Panel (main export)
   ───────────────────────────────────────────── */

export function DnsRecordsPanel() {
  const [zones, setZones] = useState<HostedZoneInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedZone, setSelectedZone] = useState<HostedZoneInfo | null>(null);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DnsRecord | null>(null);
  const [adding, setAdding] = useState(false);

  const [showCreateZone, setShowCreateZone] = useState(false);
  const [newZoneDomain, setNewZoneDomain] = useState("");
  const [creatingZone, setCreatingZone] = useState(false);
  const [nsInfo, setNsInfo] = useState<string[] | null>(null);

  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchZones = useCallback(async () => {
    try {
      const res = await fetch("/api/domains/dns?action=zones", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load zones");
      setZones(data.zones ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load zones");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecords = useCallback(async (zoneId: string) => {
    setLoadingRecords(true);
    try {
      const res = await fetch(
        `/api/domains/dns?action=records&zoneId=${encodeURIComponent(zoneId)}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load records");
      setRecords(data.records ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load records");
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleSelectZone = (zone: HostedZoneInfo) => {
    if (selectedZone?.id === zone.id) {
      setSelectedZone(null);
      setRecords([]);
      setShowAddForm(false);
      return;
    }
    setSelectedZone(zone);
    setShowAddForm(false);
    setEditingRecord(null);
    fetchRecords(zone.id);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = newZoneDomain.trim().toLowerCase();
    if (!domain || !domain.includes(".")) {
      setError("Enter a valid domain");
      return;
    }
    setCreatingZone(true);
    setError(null);
    setNsInfo(null);
    try {
      const res = await fetch("/api/domains/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "create-zone", domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create zone");
      setNsInfo(data.nameservers ?? []);
      setNewZoneDomain("");
      setShowCreateZone(false);
      await fetchZones();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create zone");
    } finally {
      setCreatingZone(false);
    }
  };

  const handleEditRecord = (record: DnsRecord) => {
    setEditingRecord(record);
    setShowAddForm(true);
  };

  const handleAddRecord = async (
    type: string,
    name: string,
    values: string[],
    ttl: number
  ) => {
    if (!selectedZone) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/domains/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "upsert-record",
          zoneId: selectedZone.id,
          name,
          type,
          values,
          ttl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add record");
      setShowAddForm(false);
      setEditingRecord(null);
      await fetchRecords(selectedZone.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add record");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteRecord = async (record: DnsRecord) => {
    if (!selectedZone) return;
    const key = `${record.type}:${record.name}`;
    setDeleting(key);
    setError(null);
    try {
      const res = await fetch("/api/domains/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "delete-record",
          zoneId: selectedZone.id,
          name: record.name,
          type: record.type,
          values: record.values,
          ttl: record.ttl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete record");
      await fetchRecords(selectedZone.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete record");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Loading DNS zones...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/60 p-3.5 dark:border-red-800/40 dark:bg-red-900/10">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 rounded p-0.5 text-red-400 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Hosted zones */}
      {zones.length > 0 && (
        <div className="space-y-2">
          {zones.map((z) => (
            <div key={z.id}>
              <button
                type="button"
                onClick={() => handleSelectZone(z)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                  selectedZone?.id === z.id
                    ? "border-sky-300 bg-sky-50/60 shadow-sm dark:border-sky-700/60 dark:bg-sky-900/15"
                    : "border-slate-200/80 bg-slate-50/40 hover:border-slate-300 dark:border-slate-700/50 dark:bg-slate-800/30 dark:hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Server
                    className={`h-4 w-4 shrink-0 ${
                      selectedZone?.id === z.id
                        ? "text-sky-600 dark:text-sky-400"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                  <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {z.name}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                    {z.recordCount} records
                  </span>
                </div>
                {selectedZone?.id === z.id ? (
                  <ChevronDown className="h-4 w-4 text-sky-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {/* Expanded zone content */}
              {selectedZone?.id === z.id && (
                <div className="mt-2 space-y-3">
                  {loadingRecords ? (
                    <div className="flex items-center gap-2 py-3 pl-4">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                      <span className="text-xs text-slate-500">
                        Loading records...
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Toolbar */}
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          DNS Records
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => fetchRecords(z.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:bg-slate-700"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Refresh
                          </button>
                          {!showAddForm && (
                            <button
                              type="button"
                              onClick={() => { setEditingRecord(null); setShowAddForm(true); }}
                              className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-sky-700 hover:shadow-sm dark:bg-sky-500 dark:hover:bg-sky-600"
                            >
                              <Plus className="h-3 w-3" />
                              Add record
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Dynamic add/edit form */}
                      {showAddForm && (
                        <DynamicDnsForm
                          onSubmit={handleAddRecord}
                          onCancel={() => { setShowAddForm(false); setEditingRecord(null); }}
                          submitting={adding}
                          zoneName={z.name}
                          editingRecord={editingRecord}
                        />
                      )}

                      {/* Records table */}
                      <div className="space-y-1">
                        {records.map((r) => {
                          const key = `${r.type}:${r.name}`;
                          const isSystem = r.type === "NS" || r.type === "SOA";
                          const badgeColor =
                            TYPE_COLORS[r.type] ??
                            "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
                          return (
                            <div
                              key={key}
                              className="group flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2.5 text-xs transition-all hover:border-slate-200 hover:shadow-sm dark:border-slate-700/40 dark:bg-slate-800/40 dark:hover:border-slate-600/60"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span
                                  className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${badgeColor}`}
                                >
                                  {r.type}
                                </span>
                                <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                                  {r.name}
                                </span>
                                <span className="hidden truncate text-slate-500 sm:inline dark:text-slate-400">
                                  {r.values.join(", ")}
                                </span>
                                {isSystem && (
                                  <Shield className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
                                )}
                                <span className="shrink-0 text-slate-400 dark:text-slate-500">
                                  TTL {r.ttl}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                                {!isSystem && (
                                  <button
                                    type="button"
                                    onClick={() => handleEditRecord(r)}
                                    className="rounded-md p-1 text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:text-slate-500 dark:hover:bg-amber-900/20 dark:hover:text-amber-400"
                                    title="Edit record"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(
                                      `${r.type} ${r.name} ${r.values.join(", ")}`
                                    )
                                  }
                                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                                  title="Copy record"
                                >
                                  {copiedText ===
                                  `${r.type} ${r.name} ${r.values.join(", ")}` ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                {!isSystem && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRecord(r)}
                                    disabled={deleting === key}
                                    className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                    title="Delete record"
                                  >
                                    {deleting === key ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {records.length === 0 && (
                          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/30 py-4 text-center dark:border-slate-700 dark:bg-slate-800/20">
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              No records found in this zone
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No zones */}
      {zones.length === 0 && !showCreateZone && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 py-6 text-center dark:border-slate-700 dark:bg-slate-800/20">
          <Server className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            No Route 53 hosted zones found
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Create one to start managing DNS records
          </p>
        </div>
      )}

      {/* NS info after zone creation */}
      {nsInfo && nsInfo.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800/40 dark:bg-emerald-900/10">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Hosted zone created! Update your registrar with these nameservers:
          </p>
          <div className="mt-2 space-y-1">
            {nsInfo.map((ns) => (
              <div
                key={ns}
                className="flex items-center gap-2 rounded-lg bg-emerald-100/80 px-3 py-1.5 dark:bg-emerald-900/30"
              >
                <code className="flex-1 text-xs font-mono text-emerald-900 dark:text-emerald-200">
                  {ns}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(ns)}
                  className="rounded p-0.5 text-emerald-700 hover:bg-emerald-200 dark:text-emerald-400 dark:hover:bg-emerald-800"
                >
                  {copiedText === ns ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create zone */}
      <div>
        {!showCreateZone ? (
          <button
            type="button"
            onClick={() => setShowCreateZone(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:border-sky-400 hover:bg-sky-50/50 hover:text-sky-600 dark:border-slate-600 dark:bg-slate-800/30 dark:text-slate-400 dark:hover:border-sky-500 dark:hover:text-sky-400"
          >
            <Plus className="h-3.5 w-3.5" />
            Create hosted zone
          </button>
        ) : (
          <form
            onSubmit={handleCreateZone}
            className="flex gap-2 rounded-xl border border-sky-200 bg-sky-50/40 p-3 dark:border-sky-800/40 dark:bg-sky-900/10"
          >
            <input
              type="text"
              value={newZoneDomain}
              onChange={(e) => setNewZoneDomain(e.target.value)}
              placeholder="example.org"
              className={inputCls + " flex-1"}
            />
            <button
              type="submit"
              disabled={creatingZone}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-600"
            >
              {creatingZone ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateZone(false);
                setNewZoneDomain("");
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
