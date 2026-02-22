"use client";

import { useState, useEffect, useCallback } from "react";

type Props = {
  organizationId: string;
};

type FormSettings = {
  forwardToEmail: string | null;
  replyName: string | null;
  autoReplyEnabled: boolean;
  autoReplyMessage: string | null;
  defaults: { forwardToEmail: string | null };
};

export function WebsiteFormsSettings({ organizationId }: Props) {
  const [settings, setSettings] = useState<FormSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forwardEmail, setForwardEmail] = useState("");
  const [replyName, setReplyName] = useState("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoReplyMessage, setAutoReplyMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/organization-website/forms-settings?organizationId=${encodeURIComponent(organizationId)}`,
        { credentials: "include" }
      );
      if (!res.ok) return;
      const data = await res.json();
      setSettings(data);
      setForwardEmail(data.forwardToEmail ?? "");
      setReplyName(data.replyName ?? "");
      setAutoReplyEnabled(data.autoReplyEnabled ?? true);
      setAutoReplyMessage(data.autoReplyMessage ?? "");
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/organization-website/forms-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          forwardToEmail: forwardEmail.trim() || null,
          replyName: replyName.trim() || null,
          autoReplyEnabled,
          autoReplyMessage: autoReplyMessage.trim() || null,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-700/50" />
      </div>
    );
  }

  const placeholder = settings?.defaults?.forwardToEmail ?? "info@yourorg.com";

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="forward_email"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
        >
          Forward form submissions to
        </label>
        <input
          id="forward_email"
          type="email"
          value={forwardEmail}
          onChange={(e) => setForwardEmail(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          When someone submits a form on your website, the inquiry is emailed here.
          {!forwardEmail && placeholder && (
            <> Defaults to <strong>{placeholder}</strong>.</>
          )}
        </p>
      </div>

      <div>
        <label
          htmlFor="reply_name"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
        >
          Reply-from display name
        </label>
        <input
          id="reply_name"
          type="text"
          value={replyName}
          onChange={(e) => setReplyName(e.target.value)}
          placeholder={settings?.defaults?.forwardToEmail ? "Your Organization" : ""}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          The name visitors see when they receive a reply email from you.
        </p>
      </div>

      <div className="border-t border-slate-200 pt-4 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <label
              htmlFor="auto_reply_enabled"
              className="mb-0.5 block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
            >
              Auto-reply to visitors
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Send a confirmation email to visitors after they submit a form.
            </p>
          </div>
          <button
            id="auto_reply_enabled"
            type="button"
            role="switch"
            aria-checked={autoReplyEnabled}
            onClick={() => setAutoReplyEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/20 ${
              autoReplyEnabled
                ? "bg-sky-500"
                : "bg-slate-200 dark:bg-slate-600"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                autoReplyEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {autoReplyEnabled && (
        <div>
          <label
            htmlFor="auto_reply_message"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
          >
            Custom auto-reply message
          </label>
          <textarea
            id="auto_reply_message"
            value={autoReplyMessage}
            onChange={(e) => setAutoReplyMessage(e.target.value)}
            placeholder={`Hi {{name}},\n\nThank you for reaching out! We received your message and someone from our team will get back to you shortly.\n\nBest regards`}
            rows={5}
            maxLength={2000}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Use <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] dark:bg-slate-700">{"{{name}}"}</code> to
            include the visitor&apos;s name. Leave blank to use the default message.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
      )}
      {success && (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Settings saved.
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-slate-800 hover:shadow-md disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
      >
        {saving ? "Saving…" : "Save form settings"}
      </button>

      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-700/40 dark:bg-slate-800/30">
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          <strong>How it works:</strong> When a visitor submits a form on your published website,
          the inquiry is stored and emailed to you. You can reply directly from your email inbox
          and the conversation stays threaded — the visitor replies back, you receive it, and so on.
          No portals or logins needed for the visitor.
        </p>
      </div>
    </div>
  );
}
