/**
 * Test script: Create CMS content + republish the Media page for Non Profit Go.
 * Run: npx tsx scripts/publish-media-test.ts
 */
import fs from "fs";
import path from "path";

// Load .env.local manually (dotenv not installed)
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)="?([^"]*)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

import { createClient } from "@supabase/supabase-js";
import { generateStaticSite } from "@/lib/site-generator";
import { uploadSiteToS3, invalidateCloudFrontCache, isHostingConfigured } from "@/lib/aws-hosting";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ORG_ID = "d13d2ffd-5982-4700-b6ef-282ef3b60735";
const ORG_SLUG = "non-profit-go";
const PROJECT_ID = "185052ab-03be-4ef0-8ab0-1ed396b10e0f";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Media page HTML with full CMS placeholders ───────────────────────────────
const MEDIA_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Media – Non Profit Go</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; background: #0f0f0f; color: #fff; }
    a { color: inherit; text-decoration: none; }
    /* NAV */
    nav { display: flex; align-items: center; justify-content: space-between;
          padding: 18px 40px; background: rgba(0,0,0,0.85); position: sticky;
          top: 0; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .nav-logo { font-size: 22px; font-weight: 700; letter-spacing: 1px; color: #d4af37; }
    .nav-links { display: flex; gap: 28px; }
    .nav-links a { font-size: 14px; font-weight: 500; letter-spacing: 0.5px;
                   color: rgba(255,255,255,0.75); transition: color .2s; }
    .nav-links a:hover, .nav-links a.active { color: #d4af37; }
    /* HERO */
    .hero { text-align: center; padding: 80px 40px 60px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); }
    .hero h1 { font-size: clamp(36px, 6vw, 72px); font-weight: 800;
               letter-spacing: -1px; line-height: 1.1; margin-bottom: 16px; }
    .hero h1 span { color: #d4af37; }
    .hero p { font-size: 18px; color: rgba(255,255,255,0.65); max-width: 560px; margin: 0 auto; }
    /* SECTIONS */
    section { padding: 80px 40px; }
    .sec-title { font-size: clamp(26px, 4vw, 42px); font-weight: 700;
                 letter-spacing: -0.5px; margin-bottom: 8px; }
    .gold-divider { width: 60px; height: 3px; background: #d4af37; margin: 16px 0 32px; }
    /* FEATURED SERMON */
    .sermon-featured { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
    .sf-thumb { position: relative; border-radius: 12px; overflow: hidden;
                aspect-ratio: 16/9; background: #222; }
    .sf-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .sf-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
    .play-btn { background: rgba(212,175,55,0.9); border: none; border-radius: 50%;
                width: 64px; height: 64px; font-size: 22px; cursor: pointer; color: #000;
                transition: transform .2s, background .2s; }
    .play-btn:hover { transform: scale(1.1); background: #d4af37; }
    .sf-info .tag { display: inline-block; background: rgba(212,175,55,0.15); color: #d4af37;
                    border: 1px solid rgba(212,175,55,0.3); border-radius: 20px;
                    padding: 4px 14px; font-size: 12px; font-weight: 600;
                    letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
    .sf-info h2 { font-size: clamp(22px, 3vw, 32px); line-height: 1.2; margin-bottom: 12px; }
    .sf-info p { color: rgba(255,255,255,0.65); line-height: 1.8; margin-bottom: 16px; }
    .sf-meta { font-size: 13px; color: rgba(255,255,255,0.45); }
    .btn-primary { display: inline-block; background: #d4af37; color: #000; border: none;
                   border-radius: 6px; padding: 12px 28px; font-weight: 700;
                   font-size: 14px; cursor: pointer; transition: opacity .2s; }
    .btn-primary:hover { opacity: 0.85; }
    .btn-outline { display: inline-block; border: 2px solid rgba(255,255,255,0.3); color: #fff;
                   border-radius: 6px; padding: 12px 28px; font-weight: 600;
                   font-size: 14px; cursor: pointer; transition: border-color .2s; }
    .btn-outline:hover { border-color: #d4af37; }
    /* PODCAST SECTION */
    .podcast-section { background: linear-gradient(135deg, #1a1a2e, #0f3460); }
    .podcast-row { display: flex; flex-direction: column; gap: 12px; }
    .pod-ep { display: flex; align-items: center; gap: 16px; padding: 16px;
              background: rgba(255,255,255,0.06); border-radius: 10px; }
    .ep-num { font-size: 28px; font-weight: 800; color: #d4af37; min-width: 44px; text-align: center; }
    .ep-info { flex: 1; }
    .ep-info h5 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .ep-info p { font-size: 12px; color: rgba(255,255,255,0.45); }
    .ep-dur { font-size: 13px; color: rgba(255,255,255,0.45); white-space: nowrap; }
    .btns { display: flex; gap: 12px; flex-wrap: wrap; }
    /* SERMON ARCHIVE */
    .sermon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .sc { background: #1a1a1a; border-radius: 12px; overflow: hidden; transition: transform .2s; }
    .sc:hover { transform: translateY(-4px); }
    .sc-thumb { position: relative; aspect-ratio: 16/9; overflow: hidden; background: #222; }
    .sc-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .sc-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
    .sc-play-sm { background: rgba(0,0,0,0.7); color: #d4af37; border-radius: 50%;
                  width: 44px; height: 44px; display: flex; align-items: center;
                  justify-content: center; font-size: 16px; }
    .sc-body { padding: 16px; }
    .stag { font-size: 11px; color: #d4af37; font-weight: 600; letter-spacing: 1px;
             text-transform: uppercase; margin-bottom: 8px; }
    .sc-body h4 { font-size: 16px; line-height: 1.3; margin-bottom: 8px; }
    .smeta { font-size: 12px; color: rgba(255,255,255,0.45); }
    /* WORSHIP */
    .worship-section { background: linear-gradient(135deg, #1a1a2e, #0d1b2a); }
    /* FOOTER */
    footer { text-align: center; padding: 40px; border-top: 1px solid rgba(255,255,255,0.08);
             color: rgba(255,255,255,0.4); font-size: 13px; }
    @media (max-width: 768px) {
      .sermon-featured { grid-template-columns: 1fr; }
      nav { padding: 14px 20px; }
      section { padding: 60px 20px; }
      .nav-links { gap: 16px; }
    }
  </style>
</head>
<body>
  <nav>
    <div class="nav-logo">Non Profit Go</div>
    <div class="nav-links">
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/events">Events</a>
      <a href="/give">Give</a>
      <a href="/media" class="active">Media</a>
      <a href="/visit">Visit</a>
    </div>
  </nav>

  <div class="hero">
    <h1>Watch, Listen &amp; <span>Worship</span></h1>
    <p>Sermons, podcasts, and live worship recordings — all in one place.</p>
  </div>

  <!-- Featured Sermon -->
  <section style="background:#111;">
    <h2 class="sec-title">Featured Sermon</h2>
    <div class="gold-divider"></div>
    {{cms:featured_sermon}}
  </section>

  <!-- Sermon Archive -->
  <section style="background:#0f0f0f;">
    <h2 class="sec-title">Sermon Archive</h2>
    <div class="gold-divider"></div>
    {{cms:sermon_archive}}
  </section>

  <!-- Podcast -->
  <section class="podcast-section">
    {{cms:podcast}}
  </section>

  <!-- Worship Recordings -->
  <section class="worship-section">
    <h2 class="sec-title light" style="color:#fff;">Worship Recordings</h2>
    <div class="gold-divider"></div>
    {{cms:worship_recordings}}
  </section>

  <footer>
    &copy; 2026 Non Profit Go &nbsp;·&nbsp; All rights reserved
  </footer>
</body>
</html>`;

async function createCmsContent() {
  console.log("📝 Creating test CMS content…");

  // Featured Sermon
  const { error: e1 } = await supabase.from("website_cms_featured_sermon").upsert({
    organization_id: ORG_ID,
    title: "Walking in Purpose",
    tag: "Current Series · Week 3",
    description: "Discover how God's plan for your life unfolds when you trust the process and surrender control. This message will transform how you see your calling.",
    speaker_name: "Pastor Marcus Johnson",
    duration_minutes: 44,
    image_url: "https://images.pexels.com/photos/8468459/pexels-photo-8468459.jpeg?auto=compress&cs=tinysrgb&w=800",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  }, { onConflict: "organization_id" });
  if (e1) console.error("  Featured sermon error:", e1.message);
  else console.log("  ✓ Featured sermon");

  // Podcast config
  const { error: e2 } = await supabase.from("website_cms_podcast_config").upsert({
    organization_id: ORG_ID,
    title: "The Go Forward Podcast",
    description: "Short weekly messages to fuel your faith and carry God's word into your Monday. Available on all major platforms.",
    spotify_url: "https://open.spotify.com/",
    apple_podcasts_url: "https://podcasts.apple.com/",
  }, { onConflict: "organization_id" });
  if (e2) console.error("  Podcast config error:", e2.message);
  else console.log("  ✓ Podcast config");

  // Podcast episodes (delete old ones first, then insert fresh)
  await supabase.from("website_cms_podcast_episodes").delete().eq("organization_id", ORG_ID);
  const episodes = [
    { organization_id: ORG_ID, episode_number: 5, title: "When God Says Wait", published_at: "2026-02-17", duration_minutes: 14 },
    { organization_id: ORG_ID, episode_number: 4, title: "Faith Over Fear", published_at: "2026-02-10", duration_minutes: 11 },
    { organization_id: ORG_ID, episode_number: 3, title: "The Power of Gratitude", published_at: "2026-02-03", duration_minutes: 12 },
    { organization_id: ORG_ID, episode_number: 2, title: "Purpose in the Valley", published_at: "2026-01-27", duration_minutes: 9 },
    { organization_id: ORG_ID, episode_number: 1, title: "Starting Again", published_at: "2026-01-20", duration_minutes: 13 },
  ];
  const { error: e3 } = await supabase.from("website_cms_podcast_episodes").insert(episodes);
  if (e3) console.error("  Podcast episodes error:", e3.message);
  else console.log("  ✓ Podcast episodes (5)");

  // Sermon archive
  await supabase.from("website_cms_sermon_archive").delete().eq("organization_id", ORG_ID);
  const sermons = [
    { organization_id: ORG_ID, sort_order: 1, title: "Walking in Purpose", tag: "Current Series", speaker_name: "Pastor Marcus Johnson", duration_minutes: 44, published_at: "2026-02-16", image_url: "https://images.pexels.com/photos/8468459/pexels-photo-8468459.jpeg?auto=compress&cs=tinysrgb&w=600", video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { organization_id: ORG_ID, sort_order: 2, title: "Roots in the Storm", tag: "Foundations Series", speaker_name: "Pastor Marcus Johnson", duration_minutes: 38, published_at: "2026-02-09", image_url: "https://images.pexels.com/photos/2566573/pexels-photo-2566573.jpeg?auto=compress&cs=tinysrgb&w=600" },
    { organization_id: ORG_ID, sort_order: 3, title: "The God Who Provides", tag: "Foundations Series", speaker_name: "Dr. Yvonne Carter", duration_minutes: 51, published_at: "2026-02-02", image_url: "https://images.pexels.com/photos/5206038/pexels-photo-5206038.jpeg?auto=compress&cs=tinysrgb&w=600" },
    { organization_id: ORG_ID, sort_order: 4, title: "Grace That Never Quits", tag: "Guest Speaker", speaker_name: "Rev. Samuel Obi", duration_minutes: 47, published_at: "2026-01-26", image_url: "https://images.pexels.com/photos/1701535/pexels-photo-1701535.jpeg?auto=compress&cs=tinysrgb&w=600" },
  ];
  const { error: e4 } = await supabase.from("website_cms_sermon_archive").insert(sermons);
  if (e4) console.error("  Sermon archive error:", e4.message);
  else console.log("  ✓ Sermon archive (4 sermons)");

  // Worship recordings
  await supabase.from("website_cms_worship_recordings").delete().eq("organization_id", ORG_ID);
  const worship = [
    { organization_id: ORG_ID, sort_order: 1, title: '"Great Are You Lord" – Live at Non Profit Go', subtitle: "Feb 16 Worship Set · 6:22" },
    { organization_id: ORG_ID, sort_order: 2, title: '"Goodness of God" – Acoustic', subtitle: "Feb 9 Worship Set · 5:47" },
    { organization_id: ORG_ID, sort_order: 3, title: '"Way Maker" – Full Band', subtitle: "Feb 2 Worship Set · 7:10" },
  ];
  const { error: e5 } = await supabase.from("website_cms_worship_recordings").insert(worship);
  if (e5) console.error("  Worship recordings error:", e5.message);
  else console.log("  ✓ Worship recordings (3)");
}

async function updateMediaPage() {
  console.log("\n🔧 Patching Media page component in project…");

  // Fetch the current project JSON
  const { data, error } = await supabase
    .from("website_builder_projects")
    .select("project")
    .eq("id", PROJECT_ID)
    .single();

  if (error || !data) {
    console.error("Failed to fetch project:", error?.message);
    return false;
  }

  const proj = data.project as { pages?: Array<{ id?: string; name: string; component?: string; frames?: unknown[] }> };
  const pages = proj.pages ?? [];

  const mediaIdx = pages.findIndex((p) => p.id === "page-media" || p.name?.toLowerCase() === "media");
  if (mediaIdx === -1) {
    console.error("Media page not found in project!");
    return false;
  }

  // Set the component HTML
  pages[mediaIdx] = { ...pages[mediaIdx], component: MEDIA_PAGE_HTML };
  proj.pages = pages;

  const { error: updateErr } = await supabase
    .from("website_builder_projects")
    .update({ project: proj })
    .eq("id", PROJECT_ID);

  if (updateErr) {
    console.error("Failed to update project:", updateErr.message);
    return false;
  }

  console.log("  ✓ Media page HTML saved to project");
  return true;
}

async function publishToS3() {
  console.log("\n🚀 Publishing to S3…");

  if (!isHostingConfigured()) {
    console.error("  ✗ AWS hosting not configured (check AWS_* env vars)");
    return false;
  }

  // Fetch the updated project
  const { data } = await supabase
    .from("website_builder_projects")
    .select("project")
    .eq("id", PROJECT_ID)
    .single();

  if (!data) {
    console.error("  ✗ Could not fetch project");
    return false;
  }

  const projectJson = data.project as { pages?: Array<{ id?: string; name: string; component?: string }> };

  console.log("  Generating static pages…");
  const pages = await generateStaticSite(projectJson, ORG_ID, ORG_SLUG);
  console.log(`  Generated ${pages.length} pages:`, pages.map((p) => `/${p.slug || ""}(${p.html.length}b)`).join(", "));

  const mediaPage = pages.find((p) => p.slug === "media");
  if (mediaPage) {
    console.log("  ✓ Media page generated:", mediaPage.html.length, "bytes");
    const hasCmsBlock = mediaPage.html.includes("data-cms-block=");
    const hasRealtimeScript = mediaPage.html.includes("data-cms-live=");
    console.log("    CMS blocks injected:", hasCmsBlock);
    console.log("    Real-time script injected:", hasRealtimeScript);
  } else {
    console.log("  ⚠ No media page in output (check page.component length)");
  }

  const s3Pages = pages.map((p) => ({ slug: p.slug, html: p.html }));
  console.log("  Uploading to S3…");
  const uploadResult = await uploadSiteToS3(ORG_SLUG, s3Pages);
  if (!uploadResult.ok) {
    console.error("  ✗ S3 upload failed:", uploadResult.error);
    return false;
  }
  console.log("  ✓ Uploaded to S3");

  console.log("  Invalidating CloudFront cache…");
  const cfResult = await invalidateCloudFrontCache(ORG_SLUG);
  if (!cfResult.ok) {
    console.warn("  ⚠ CloudFront invalidation:", cfResult.error);
  } else {
    console.log("  ✓ CloudFront cache invalidated");
  }

  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log("=== Non Profit Go — Media Page Test Publish ===\n");

  await createCmsContent();
  const patched = await updateMediaPage();
  if (!patched) {
    process.exit(1);
  }

  const published = await publishToS3();
  if (published) {
    console.log("\n✅ Done! Visit: https://www.nexttestgo.online/media");
    console.log("   CloudFront TTL ~60s — refresh if content is still old.");
  } else {
    console.log("\n⚠ S3 publish skipped. CMS content and project HTML were still saved.");
    console.log("  Trigger republish manually from the dashboard.");
  }
})();
