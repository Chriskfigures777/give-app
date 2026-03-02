"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TeamEditorClient } from "./team-editor-client";
import { PexelsMediaPicker } from "@/components/pexels-media-picker";

type Profile = {
  id: string;
  name: string;
  slug: string;
  page_hero_video_url: string | null;
  page_hero_image_url: string | null;
  page_summary: string | null;
  page_mission: string | null;
  page_goals: string | null;
  page_story: string | null;
  page_story_image_url: string | null;
  page_donation_goal_cents: number | null;
  card_preview_image_url: string | null;
  card_preview_video_url: string | null;
};

type ProfileFormClientProps = {
  profile: Profile;
  baseUrl: string;
  compact?: boolean;
};

export function ProfileFormClient({ profile, baseUrl, compact }: ProfileFormClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pexelsPicker, setPexelsPicker] = useState<{ field: keyof typeof form; mode: "photos" | "videos" } | null>(null);
  const [form, setForm] = useState({
    page_hero_video_url: profile.page_hero_video_url ?? "",
    page_hero_image_url: profile.page_hero_image_url ?? "",
    page_summary: profile.page_summary ?? "",
    page_mission: profile.page_mission ?? "",
    page_goals: profile.page_goals ?? "",
    page_story: profile.page_story ?? "",
    page_story_image_url: profile.page_story_image_url ?? "",
    page_donation_goal_dollars: profile.page_donation_goal_cents != null ? String(profile.page_donation_goal_cents / 100) : "",
    card_preview_image_url: profile.card_preview_image_url ?? "",
    card_preview_video_url: profile.card_preview_video_url ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/organization-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: profile.id,
          page_hero_video_url: form.page_hero_video_url || null,
          page_hero_image_url: form.page_hero_image_url || null,
          page_summary: form.page_summary || null,
          page_mission: form.page_mission || null,
          page_goals: form.page_goals || null,
          page_story: form.page_story || null,
          page_story_image_url: form.page_story_image_url || null,
          page_donation_goal_cents: form.page_donation_goal_dollars ? Math.round(parseFloat(form.page_donation_goal_dollars) * 100) : null,
          card_preview_image_url: form.card_preview_image_url || null,
          card_preview_video_url: form.card_preview_video_url || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const orgHref = `/org/${profile.slug}`;

  return (
    <>
      {pexelsPicker && (
        <PexelsMediaPicker
          mode={pexelsPicker.mode}
          onSelect={(url) => {
            setForm((f) => ({ ...f, [pexelsPicker.field]: url }));
            setPexelsPicker(null);
          }}
          onClose={() => setPexelsPicker(null)}
        />
      )}
    <div className="space-y-8">
      {!compact && (
        <>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Public page
            </h1>
            <p className="mt-2 text-slate-600">
              Customize how your organization appears when people discover you through search.
            </p>
            <Link
              href={orgHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-emerald-600 hover:underline font-medium"
            >
              View your page
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Page preview</h2>
            <p className="mt-1 text-sm text-slate-600">
              How your public page looks to visitors. Edit the sections below to update your page.
            </p>
            <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
              <iframe
                src={`${baseUrl}/org/${profile.slug}`}
                title={`Preview: ${profile.name}`}
                className="w-full"
                style={{ height: "min(500px, 60vh)" }}
              />
            </div>
            <a
              href={orgHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:underline"
            >
              View full page
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </section>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">Hero section</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hero video URL (Pexels MP4)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.page_hero_video_url}
                onChange={(e) => setForm((f) => ({ ...f, page_hero_video_url: e.target.value }))}
                placeholder="https://..."
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
              />
              <Button type="button" variant="outline" onClick={() => setPexelsPicker({ field: "page_hero_video_url", mode: "videos" })}>
                Search Pexels
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hero image URL (fallback)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.page_hero_image_url}
                onChange={(e) => setForm((f) => ({ ...f, page_hero_image_url: e.target.value }))}
                placeholder="https://..."
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
              />
              <Button type="button" variant="outline" onClick={() => setPexelsPicker({ field: "page_hero_image_url", mode: "photos" })}>
                Search Pexels
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">About content</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Summary (brief overview)</label>
            <textarea
              value={form.page_summary}
              onChange={(e) => setForm((f) => ({ ...f, page_summary: e.target.value }))}
              rows={3}
              placeholder="A welcoming community church..."
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mission statement</label>
            <textarea
              value={form.page_mission}
              onChange={(e) => setForm((f) => ({ ...f, page_mission: e.target.value }))}
              rows={3}
              placeholder="Our mission is to..."
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Goals (what you&apos;re working toward)</label>
            <textarea
              value={form.page_goals}
              onChange={(e) => setForm((f) => ({ ...f, page_goals: e.target.value }))}
              rows={3}
              placeholder="We're raising funds to..."
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">Story section</h2>
          <p className="text-sm text-slate-600">Optional. Tell your organization&apos;s story with text and an image.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Story text</label>
            <textarea
              value={form.page_story}
              onChange={(e) => setForm((f) => ({ ...f, page_story: e.target.value }))}
              rows={4}
              placeholder="Share your organization's story..."
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Story image URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.page_story_image_url}
                onChange={(e) => setForm((f) => ({ ...f, page_story_image_url: e.target.value }))}
                placeholder="https://..."
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
              />
              <Button type="button" variant="outline" onClick={() => setPexelsPicker({ field: "page_story_image_url", mode: "photos" })}>
                Search Pexels
              </Button>
            </div>
          </div>
        </div>

        <TeamEditorClient organizationId={profile.id} />

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">Card preview</h2>
          <p className="text-sm text-slate-600">
            Customize how your organization appears on search result cards. Add a video to play when donors hover over your card.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Card image URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.card_preview_image_url}
                onChange={(e) => setForm((f) => ({ ...f, card_preview_image_url: e.target.value }))}
                placeholder="https://... (uses logo if empty)"
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
              />
              <Button type="button" variant="outline" onClick={() => setPexelsPicker({ field: "card_preview_image_url", mode: "photos" })}>
                Search Pexels
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Video URL for explore card hover</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.card_preview_video_url}
                onChange={(e) => setForm((f) => ({ ...f, card_preview_video_url: e.target.value }))}
                placeholder="https://... (Pexels MP4)"
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
              />
              <Button type="button" variant="outline" onClick={() => setPexelsPicker({ field: "card_preview_video_url", mode: "videos" })}>
                Search Pexels
              </Button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              <a href="https://www.pexels.com/search/videos/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Find free videos on Pexels</a>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Donation goal (optional, in dollars)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.page_donation_goal_dollars}
              onChange={(e) => setForm((f) => ({ ...f, page_donation_goal_dollars: e.target.value }))}
              placeholder="0"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-slate-900"
            />
          </div>
        </div>

        <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
    </>
  );
}
