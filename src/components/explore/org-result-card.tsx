"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { motion } from "motion/react";
import { MapPin, Heart, ArrowUpRight } from "lucide-react";

export type OrgResult = {
  id: string;
  name: string;
  slug: string;
  org_type: string | null;
  city: string | null;
  state: string | null;
  causes: string[];
  logo_url: string | null;
  profile_image_url?: string | null;
  description: string | null;
  card_preview_image_url?: string | null;
  card_preview_video_url?: string | null;
  page_hero_video_url?: string | null;
};

const PLACEHOLDER_LOGO =
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80";

function getPreviewImageUrl(org: OrgResult): string {
  return (
    org.profile_image_url ??
    org.card_preview_image_url ??
    org.logo_url ??
    PLACEHOLDER_LOGO
  );
}

function getPreviewVideoUrl(org: OrgResult): string | null {
  return org.card_preview_video_url ?? org.page_hero_video_url ?? null;
}

function getOrgTypeBadge(orgType: string | null) {
  switch (orgType) {
    case "church":
      return { label: "Church", className: "bg-amber-100/90 text-amber-800 backdrop-blur-sm" };
    case "nonprofit":
      return { label: "Nonprofit", className: "bg-sky-100/90 text-sky-800 backdrop-blur-sm" };
    case "missionary":
      return { label: "Missionary", className: "bg-violet-100/90 text-violet-800 backdrop-blur-sm" };
    default:
      return { label: "Organization", className: "bg-white/80 text-slate-600 backdrop-blur-sm" };
  }
}

export function OrgResultCard({ org, index = 0 }: { org: OrgResult; index?: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoUrl = getPreviewVideoUrl(org);
  const hasVideo = !!previewVideoUrl;
  const previewImageUrl = getPreviewImageUrl(org);
  const badge = getOrgTypeBadge(org.org_type);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !previewVideoUrl) return;
    if (isHovered) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isHovered, previewVideoUrl]);

  useEffect(() => {
    fetch(`/api/org-page-status?organizationId=${encodeURIComponent(org.id)}`)
      .then((r) => r.json())
      .then((data) => setIsSaved(data.isSaved ?? false))
      .catch(() => setIsSaved(false));
  }, [org.id]);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    setSaving(true);
    try {
      if (isSaved) {
        const res = await fetch(`/api/donor/save-organization?slug=${encodeURIComponent(org.slug)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to unsave");
        setIsSaved(false);
      } else {
        const res = await fetch("/api/donor/save-organization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: org.slug }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        setIsSaved(true);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("Unauthorized")) {
        window.location.href = `/login?redirect=/explore`;
      } else {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
    >
      <Link
        href={`/org/${org.slug}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative block overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-300 hover:border-emerald-200/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08),0_2px_8px_rgba(16,185,129,0.08)]"
      >
        {/* Image area */}
        <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
          <Image
            src={previewImageUrl}
            alt={org.name}
            fill
            className={`object-cover transition-transform duration-700 ease-out ${
              hasVideo
                ? "group-hover:scale-105"
                : "group-hover:scale-[1.08]"
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {hasVideo && (
            <video
              ref={videoRef}
              src={previewVideoUrl}
              muted
              loop
              playsInline
              preload="metadata"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {/* Type badge */}
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${badge.className}`}>
              {badge.label}
            </span>
          </div>

          {/* Save button on image */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 disabled:opacity-50 ${
              isSaved
                ? "bg-white/90 text-rose-500 shadow-md backdrop-blur-sm"
                : "bg-black/20 text-white backdrop-blur-sm hover:bg-white/90 hover:text-rose-500 hover:shadow-md"
            }`}
            title={isSaved ? "Saved" : "Save"}
          >
            <Heart
              className={`h-4 w-4 transition-transform duration-200 ${isSaved ? "fill-rose-500 scale-110" : "group-hover:scale-110"}`}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-emerald-700">
            {org.name}
          </h3>
          {org.description && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">
              {org.description}
            </p>
          )}

          {/* Causes */}
          {org.causes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {org.causes.slice(0, 3).map((cause) => (
                <span
                  key={cause}
                  className="rounded-md bg-emerald-50/80 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                >
                  {cause}
                </span>
              ))}
            </div>
          )}

          {/* Location */}
          {org.city && org.state && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-400">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>
                {org.city}, {org.state}
              </span>
            </div>
          )}

          {/* CTA */}
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-600 transition-colors group-hover:text-emerald-700">
            Give now
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
