import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * Returns an HTML page that loads the GrapeJS Studio editor in an iframe.
 * Uses React 18 from CDN to avoid React 19 ref compatibility issues.
 */
export async function GET(req: NextRequest) {
  try {
    const { profile, supabase } = await requireAuth();
    const orgId = profile?.organization_id ?? profile?.preferred_organization_id;

    if (!orgId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    const organizationId = orgId;
    const licenseKey = process.env.NEXT_PUBLIC_GRAPEJS_LICENSE_KEY ?? "";

    // Fetch org name to display in the project list
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single();
    const orgName = (orgRow as { name?: string } | null)?.name ?? "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Website Builder</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@grapesjs/studio-sdk@1.0.58/dist/style.css" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    /* CMS-bound elements: purple indicator in layers panel (Webflow-style) */
    [data-has-cms-binding] .gjs-layer__label,
    [data-has-cms-binding] .gjs-layer-title,
    [data-has-cms-binding].gjs-layer > div,
    .gjs-layer[data-has-cms-binding] .gjs-layer__label,
    .gjs-layer[data-has-cms-binding] .gjs-layer-title,
    [data-has-cms-binding] [class*="layer"],
    [data-has-cms-binding] [class*="Layer"] { color: #9333ea !important; font-weight: 600; }
    .gjs-layer[data-has-cms-binding]::before,
    [data-has-cms-binding][class*="layer"]::before,
    [data-has-cms-binding][class*="Layer"]::before { content: 'CMS'; font-size: 9px; background: #9333ea; color: white; padding: 1px 4px; border-radius: 3px; margin-right: 6px; display: inline-block; vertical-align: middle; }
    .gjs-cms-btn::before { content: '\\1F4C2'; font-size: 14px; }
    /* Hide GrapesJS Studio branding watermark */
    .gs-banner { display: none !important; }
  </style>
</head>
<body style="margin:0;height:100vh;overflow:hidden;font-family:'Inter',sans-serif;position:relative;">
  <div id="loading-overlay" style="position:fixed;inset:0;background:hsl(220,14%,96%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:9999;">
    <div style="width:40px;height:40px;border:3px solid hsl(220,13%,91%);border-top-color:hsl(160,84%,39%);border-radius:50%;animation:spin 0.8s linear infinite;"></div>
    <div style="color:hsl(215,16%,47%);font-size:15px;">Loading website builder...</div>
  </div>
  <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  <div id="studio" style="height:100%;width:100%;display:none;"></div>
  <div id="project-selector" style="display:none;position:absolute;inset:0;background:hsl(220,14%,96%);padding:48px;overflow-y:auto;overflow-x:hidden;font-family:'Inter',sans-serif;">
    <div style="max-width:900px;margin:0 auto;">
      <h1 id="project-heading" style="color:hsl(222,47%,11%);font-size:24px;font-weight:700;margin-bottom:8px;">Your website projects</h1>
      <p id="project-subheading" style="color:hsl(215,16%,47%);font-size:14px;margin-bottom:32px;">Open a project to continue editing, or create a new one from a template.</p>
      <div id="project-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;"></div>
    </div>
  </div>
  <div id="template-picker" style="display:none;position:absolute;inset:0;background:hsl(220,14%,96%);padding:48px;overflow-y:auto;overflow-x:hidden;font-family:'Inter',sans-serif;">
    <div style="max-width:800px;margin:0 auto;">
      <button type="button" id="template-back-btn" style="background:none;border:none;color:hsl(215,16%,47%);font-size:14px;cursor:pointer;margin-bottom:24px;display:flex;align-items:center;gap:6px;">← Back to projects</button>
      <h1 style="color:hsl(222,47%,11%);font-size:24px;font-weight:700;margin-bottom:8px;">Choose a template</h1>
      <p style="color:hsl(215,16%,47%);font-size:14px;margin-bottom:32px;">Start with a blank page or a pre-built church website design.</p>
      <div id="template-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:24px;"></div>
    </div>
  </div>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
  <script>
    (function(){
      var _origFetch = window.fetch;
      window.fetch = function() {
        var url = arguments[0];
        if (typeof url === 'string' && url.indexOf('/sdk/') > -1) {
          return _origFetch.apply(this, arguments).then(function(resp) {
            return resp.clone().text().then(function(body) {
              try {
                var json = JSON.parse(body);
                if (json && json.result && json.result.plan) {
                  json.result.plan.poweredBy = false;
                }
                return new Response(JSON.stringify(json), {
                  status: resp.status,
                  statusText: resp.statusText,
                  headers: resp.headers
                });
              } catch(e) { return resp; }
            });
          });
        }
        return _origFetch.apply(this, arguments);
      };
    })();
  </script>
  <script src="https://cdn.jsdelivr.net/npm/grapesjs@0.22.14/dist/js/grapes.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@grapesjs/studio-sdk@1.0.58/dist/index.umd.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@grapesjs/studio-sdk-plugins@1.0.33/dist/index.umd.js"></script>
  <script>
    (function() {
      var organizationId = ${JSON.stringify(organizationId)};
      var licenseKey = ${JSON.stringify(licenseKey)};
      var orgName = ${JSON.stringify(orgName)};
      var orgStatus = { siteUrl: null, publishedUrl: null, publishedProjectId: null, hasCustomDomain: false, customDomain: null };
      var listPagesComponent = window.GrapesJsStudioSdkPlugins?.listPagesComponent || window.StudioSdkPlugins?.listPagesComponent;
      var swiperComponent = window.GrapesJsStudioSdkPlugins?.swiperComponent || window.StudioSdkPlugins?.swiperComponent;
      var createStudioEditor = (window.GrapesJsStudioSDK && (window.GrapesJsStudioSDK.default || window.GrapesJsStudioSDK.createStudioEditor)) || window.createStudioEditor;

      if (!createStudioEditor) {
        document.getElementById('studio').innerHTML = '<div style="padding:20px;font-family:sans-serif;">Failed to load editor. Please refresh.</div>';
        return;
      }

      var editorInstance = null;

      async function injectCmsIntoProject(project) {
        if (!project || !project.pages || !project.pages.length) return project;
        var proj = { ...project, pages: project.pages.map(function(p) { return { ...p }; }) };
        for (var i = 0; i < proj.pages.length; i++) {
          var comp = proj.pages[i].component;
          if (typeof comp !== 'string') continue;
          if (comp.indexOf('{{cms:') < 0 && comp.indexOf('data-cms-binding') < 0 && comp.indexOf('data-cms-field') < 0 && comp.indexOf('<!-- cms:') < 0) continue;
          try {
            var r = await fetch('/api/website-builder/inject-cms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ organizationId: organizationId, html: comp }),
              credentials: 'include'
            });
            if (r.ok) {
              var d = await r.json();
              if (d && d.html) proj.pages[i].component = d.html;
            }
          } catch (e) { console.warn('CMS inject failed for page', i, e); }
        }
        return proj;
      }

      async function stripCmsFromProject(project) {
        if (!project || !project.pages) return project;
        try {
          var r = await fetch('/api/website-builder/strip-cms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: project }),
            credentials: 'include'
          });
          if (r.ok) {
            var d = await r.json();
            if (d && d.project) return d.project;
          }
        } catch (e) { console.warn('CMS strip failed', e); }
        return project;
      }

      function buildOpts(initialProject, projectId) {
        var storageConfig = {
          type: 'self',
          onSave: async function(_ref) {
            var project = _ref.project;
            var projectToSave = await stripCmsFromProject(project);
            var body = { organizationId: organizationId, project: projectToSave };
            if (projectId) body.id = projectId;
            if (editorInstance && typeof editorInstance.getHtml === 'function') {
              try {
                var pm = editorInstance.Pages;
                var currentPage = null;
                if (pm && pm.getAll && pm.getSelected && pm.select) {
                  var allPages = pm.getAll();
                  var firstPage = allPages[0];
                  currentPage = pm.getSelected();
                  if (firstPage && firstPage !== currentPage) pm.select(firstPage);
                }
                var html = editorInstance.getHtml();
                var css = (editorInstance.getCss && editorInstance.getCss()) || '';
                body.previewHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' + css + '</style></head><body>' + html + '</body></html>';
                if (pm && pm.select && currentPage) pm.select(currentPage);
              } catch (e) {}
            }
            var r = await fetch('/api/website-builder/project', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
              credentials: 'include'
            });
            if (!r.ok) {
              var text = await r.text();
              var d;
              try { d = JSON.parse(text); } catch (_) { d = {}; }
              throw new Error(d.error || 'Save failed (status ' + r.status + ')');
            }
          },
          autosaveChanges: 100,
          autosaveIntervalMs: 10000,
          onLoad: async function() {
            if (!projectId) return { project: await injectCmsIntoProject(initialProject) };
            var r = await fetch('/api/website-builder/project?organizationId=' + encodeURIComponent(organizationId) + '&id=' + encodeURIComponent(projectId), { credentials: 'include' });
            var text = await r.text();
            var data;
            try { data = JSON.parse(text); } catch (_) { data = {}; }
            if (!r.ok) throw new Error(data.error || 'Load failed (status ' + r.status + ')');
            var proj = data.project || { pages: [{ name: 'Home', component: '<h1>Home</h1>' }] };
            return { project: await injectCmsIntoProject(proj) };
          }
        };
        if (initialProject && hasProjectContent(initialProject)) {
          storageConfig.project = initialProject;
        }
        var cmsBlocks = [
          { id: 'cms-text', label: 'CMS Text', category: 'CMS', media: '<span style="font-size:20px;padding:6px;">T</span>', content: '<span data-cms-binding="featured_sermon.title">Sermon Title</span>' },
          { id: 'cms-image', label: 'CMS Image', category: 'CMS', media: '<span style="font-size:20px;padding:6px;">🖼</span>', content: '<img src="https://via.placeholder.com/400x300?text=CMS+Image" alt="CMS" data-cms-binding="events.image_url" style="max-width:100%;height:auto;">' },
          { id: 'cms-link', label: 'CMS Link', category: 'CMS', media: '<span style="font-size:20px;padding:6px;">🔗</span>', content: '<a href="#" data-cms-binding="events.url">Event Link</a>' },
          { id: 'cms-heading', label: 'CMS Heading', category: 'CMS', media: '<span style="font-size:20px;padding:6px;">H</span>', content: '<h2 data-cms-binding="featured_sermon.title">Sermon Title</h2>' },
          { id: 'cms-paragraph', label: 'CMS Paragraph', category: 'CMS', media: '<span style="font-size:20px;padding:6px;">¶</span>', content: '<p data-cms-binding="featured_sermon.description">Sermon description</p>' }
        ];
        return {
        root: document.getElementById('studio'),
        theme: 'light',
        project: { type: 'web', default: { pages: [{ name: 'Home', component: '<h1>Home</h1>' }] } },
        blocks: { default: cmsBlocks },
        assets: {
          storageType: 'self',
          onUpload: async function(_ref) {
            var files = _ref.files;
            var body = new FormData();
            body.append('organizationId', organizationId);
            for (var i = 0; i < files.length; i++) body.append('files', files[i]);
            var r = await fetch('/api/upload/website-builder-assets', { method: 'POST', body: body, credentials: 'include' });
            var text = await r.text();
            var data;
            try { data = JSON.parse(text); } catch (_) { data = {}; }
            if (!r.ok) throw new Error(data.error || 'Upload failed (status ' + r.status + ')');
            return data;
          },
          onDelete: async function(_ref) {
            var assetProps = _ref.assetProps;
            var assets = assetProps.map(function(a) { return { src: a.src }; });
            var r = await fetch('/api/website-builder-assets', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ assets: assets }),
              credentials: 'include'
            });
            if (!r.ok) {
              var text = await r.text();
              var d;
              try { d = JSON.parse(text); } catch (_) { d = {}; }
              throw new Error(d.error || 'Delete failed (status ' + r.status + ')');
            }
          }
        },
        storage: storageConfig,
        plugins: []
        };
      }

      function hideLoading() {
        var el = document.getElementById('loading-overlay');
        if (el) el.style.display = 'none';
      }

      function notifyParentProjectLoaded(projectId) {
        if (typeof window !== 'undefined' && window.parent !== window) {
          window.parent.postMessage({
            type: 'editor-project-loaded',
            projectId: projectId,
            siteUrl: orgStatus.siteUrl || null,
            publishedUrl: orgStatus.publishedUrl || orgStatus.siteUrl || null,
            isPublished: orgStatus.publishedProjectId === projectId,
            hasCustomDomain: orgStatus.hasCustomDomain || false,
            customDomain: orgStatus.customDomain || null
          }, '*');
        }
      }

      async function initEditor(project, projectId) {
        hideLoading();
        notifyParentProjectLoaded(projectId);
        var injectedProject = await injectCmsIntoProject(project);
        var opts = buildOpts(injectedProject, projectId);
        if (licenseKey) opts.licenseKey = licenseKey;
        // Only add listPages/swiper when licensed — unlicensed plugins get cleaned up and cause lastComponent crash
        if (licenseKey && listPagesComponent && listPagesComponent.init) opts.plugins.push(listPagesComponent.init({}));
        if (licenseKey && swiperComponent && swiperComponent.init) opts.plugins.push(swiperComponent.init({}));
        opts.plugins.push(function(editor) {
          var ed = (editor && editor.getEditor) ? editor.getEditor() : editor;
          editorInstance = editor;
          (function addCmsBindingPlugin() {
            if (!ed) return;
            var Traits = ed.Traits || ed.TraitManager;
            var DomComponents = ed.DomComponents;
            if (!Traits || !DomComponents) return;
            var CMS_BINDINGS = [
              { id: '', name: '— None —' },
              { id: 'events.name', name: 'Events → Name' },
              { id: 'events.description', name: 'Events → Description' },
              { id: 'events.image_url', name: 'Events → Image URL' },
              { id: 'events.start_at', name: 'Events → Start Date' },
              { id: 'events.venue_name', name: 'Events → Location' },
              { id: 'events.category', name: 'Events → Category' },
              { id: 'events.url', name: 'Events → URL' },
              { id: 'featured_sermon.title', name: 'Featured Sermon → Title' },
              { id: 'featured_sermon.tag', name: 'Featured Sermon → Tag' },
              { id: 'featured_sermon.description', name: 'Featured Sermon → Description' },
              { id: 'featured_sermon.image_url', name: 'Featured Sermon → Image URL' },
              { id: 'featured_sermon.video_url', name: 'Featured Sermon → Video URL' },
              { id: 'featured_sermon.audio_url', name: 'Featured Sermon → Audio URL' },
              { id: 'featured_sermon.speaker_name', name: 'Featured Sermon → Speaker' },
              { id: 'podcast.title', name: 'Podcast → Title' },
              { id: 'podcast.description', name: 'Podcast → Description' },
              { id: 'podcast.spotify_url', name: 'Podcast → Spotify URL' },
              { id: 'podcast.apple_podcasts_url', name: 'Podcast → Apple URL' },
              { id: 'podcast_episodes.episode_number', name: 'Podcast Episode → Number' },
              { id: 'podcast_episodes.title', name: 'Podcast Episode → Title' },
              { id: 'podcast_episodes.published_at', name: 'Podcast Episode → Date' },
              { id: 'podcast_episodes.duration_minutes', name: 'Podcast Episode → Duration' },
              { id: 'worship_recordings.title', name: 'Worship → Title' },
              { id: 'worship_recordings.subtitle', name: 'Worship → Subtitle' },
              { id: 'worship_recordings.url', name: 'Worship → URL' },
              { id: 'sermon_archive.title', name: 'Sermon Archive → Title' },
              { id: 'sermon_archive.tag', name: 'Sermon Archive → Tag' },
              { id: 'sermon_archive.image_url', name: 'Sermon Archive → Image URL' },
              { id: 'sermon_archive.published_at', name: 'Sermon Archive → Date' },
              { id: 'sermon_archive.duration_minutes', name: 'Sermon Archive → Duration' },
              { id: 'sermon_archive.speaker_name', name: 'Sermon Archive → Speaker' },
              { id: 'sermon_archive.video_url', name: 'Sermon Archive → Video URL' },
              { id: 'sermon_archive.audio_url', name: 'Sermon Archive → Audio URL' }
            ];
            Traits.addType('cms_bind', {
              createInput: function(trait) {
                var el = document.createElement('select');
                el.className = 'gjs-field gjs-select';
                el.setAttribute('data-cms-trait', '1');
                el.style.borderColor = 'rgba(147,51,234,0.5)';
                CMS_BINDINGS.forEach(function(opt) {
                  var o = document.createElement('option');
                  o.value = opt.id;
                  o.textContent = opt.name;
                  el.appendChild(o);
                });
                return el;
              },
              onEvent: function(component, event) {
                var val = event.target.value || '';
                var attrs = (component && component.getAttributes) ? component.getAttributes() : (component && component.attributes) || {};
                var useField = !!attrs['data-cms-field'];
                if (useField) {
                  component.addAttributes({ 'data-cms-field': val || undefined });
                } else {
                  component.addAttributes({ 'data-cms-binding': val || undefined });
                }
              },
              onUpdate: function(component, el) {
                if (!el || typeof el.value === 'undefined') return;
                var attrs = (component && component.getAttributes) ? component.getAttributes() : (component && component.attributes) || {};
                var val = attrs['data-cms-binding'] || attrs['data-cms-field'] || '';
                el.value = val;
                el.style.borderColor = val ? '#9333ea' : 'rgba(147,51,234,0.5)';
              }
            });
            var BlockManager = ed.BlockManager || ed.Blocks;
            if (BlockManager && !BlockManager.get('cms-text')) {
                BlockManager.add('cms-text', { label: 'CMS Text', category: 'CMS', media: '<span style="font-size:20px;">T</span>', content: '<span data-cms-binding="featured_sermon.title">Sermon Title</span>' });
                BlockManager.add('cms-image', { label: 'CMS Image', category: 'CMS', media: '<span style="font-size:20px;">🖼</span>', content: '<img src="https://via.placeholder.com/400x300?text=CMS+Image" alt="CMS" data-cms-binding="events.image_url" style="max-width:100%;height:auto;">' });
                BlockManager.add('cms-link', { label: 'CMS Link', category: 'CMS', media: '<span style="font-size:20px;">🔗</span>', content: '<a href="#" data-cms-binding="events.url">Event Link</a>' });
                BlockManager.add('cms-heading', { label: 'CMS Heading', category: 'CMS', media: '<span style="font-size:20px;">H</span>', content: '<h2 data-cms-binding="featured_sermon.title">Sermon Title</h2>' });
                BlockManager.add('cms-paragraph', { label: 'CMS Paragraph', category: 'CMS', media: '<span style="font-size:20px;">¶</span>', content: '<p data-cms-binding="featured_sermon.description">Sermon description</p>' });
            }
            editor.Commands.add('open-cms-trait', function() {
              var traitEl = document.querySelector('[data-cms-trait]');
              if (traitEl) { traitEl.focus(); traitEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
            });
            editor.Commands.add('refresh-cms', async function() {
              try {
                var proj = editor.getProjectData && editor.getProjectData();
                if (!proj) return;
                var stripped = await stripCmsFromProject(proj);
                var injected = await injectCmsIntoProject(stripped);
                if (editor.loadProjectData) editor.loadProjectData(injected);
              } catch (e) { console.warn('CMS refresh failed', e); }
            });
            var cmsToolbarBtn = { attributes: { class: 'gjs-cms-btn', title: 'Bind to CMS' }, command: 'open-cms-trait' };
            function addCmsTraitToType(typeId) {
              try {
                var type = DomComponents.getType(typeId);
                if (!type) return;
                var baseTraits = (type.model && type.model.defaults && type.model.defaults.traits) || [];
                var existing = Array.isArray(baseTraits) ? baseTraits.slice() : [];
                var hasCms = existing.some(function(t) {
                  var n = typeof t === 'string' ? t : (t && t.name);
                  return n === 'data-cms-binding' || n === 'data-cms-collection';
                });
                if (hasCms) return;
                existing.push({ type: 'cms_bind', name: 'data-cms-binding', label: 'Bind to CMS' });
                var defs = type.model && type.model.defaults || {};
                var toolbar = Array.isArray(defs.toolbar) ? defs.toolbar.slice() : [];
                if (!toolbar.some(function(b) { return b && b.command === 'open-cms-trait'; })) toolbar.push(cmsToolbarBtn);
                DomComponents.addType(typeId, {
                  extend: typeId,
                  model: {
                    defaults: {
                      traits: existing,
                      toolbar: toolbar
                    }
                  }
                });
              } catch (_) {}
            }
            var typesToExtend = ['text', 'image', 'link', 'default', '1', 'cell', 'row', 'column', 'section', 'span', 'label', 'button', 'wrapper', 'component'];
            typesToExtend.forEach(addCmsTraitToType);
            try {
              var allTypes = DomComponents.getTypes && DomComponents.getTypes();
              if (allTypes && typeof allTypes === 'object') {
                Object.keys(allTypes).forEach(function(k) {
                  if (typesToExtend.indexOf(k) < 0) addCmsTraitToType(k);
                });
              }
            } catch (_) {}
            Traits.addType('page_select', {
              createInput: function(trait) {
                var el = document.createElement('select');
                el.className = 'gjs-field gjs-select';
                el.style.cssText = 'width:100%;padding:6px 8px;border:1px solid rgba(0,0,0,0.15);border-radius:4px;';
                var opt0 = document.createElement('option');
                opt0.value = '';
                opt0.textContent = '\u2014 Custom URL \u2014';
                el.appendChild(opt0);
                var pm = editor.Pages || {};
                var allPages = (pm.getAll && pm.getAll()) || [];
                allPages.forEach(function(p, idx) {
                  var o = document.createElement('option');
                  var id = (p.getId && p.getId()) || (p.id !== undefined ? p.id : idx);
                  var name = (p.getName && p.getName()) || (p.name || ('Page ' + (idx + 1)));
                  o.value = '#' + id;
                  o.textContent = name;
                  el.appendChild(o);
                });
                return el;
              },
              onEvent: function(component, event) {
                var val = event.target.value;
                if (val) component.addAttributes({ href: val });
              },
              onUpdate: function(component, el) {
                if (!el || typeof el.value === 'undefined') return;
                var href = ((component.getAttributes && component.getAttributes()) || {})['href'] || '';
                var matched = false;
                for (var i = 0; i < el.options.length; i++) {
                  if (el.options[i].value === href) { el.value = href; matched = true; break; }
                }
                if (!matched) el.value = '';
              }
            });
            try {
              DomComponents.addType('link', {
                extend: 'link',
                model: {
                  defaults: {
                    traits: [
                      { type: 'page_select', name: 'pageLink', label: 'Link to Page', changeProp: true },
                      { name: 'href', label: 'Link URL' },
                      { type: 'select', name: 'target', label: 'Open in', options: [
                        { value: '', name: 'Same window' },
                        { value: '_blank', name: 'New window' }
                      ]},
                      { name: 'title', label: 'Title' },
                      { type: 'cms_bind', name: 'data-cms-binding', label: 'Bind to CMS' }
                    ]
                  }
                }
              });
            } catch(_) {}
          })();
          editor.on('canvas:frame:load:body', function(ev) {
            var win = ev && ev.window;
            if (!win || !win.document) return;
            var doc = win.document;
            if (!doc.body) return;
            if (!doc.body.getAttribute('data-gjs-pagelinks-bound')) {
            if (doc.body) doc.body.setAttribute('data-gjs-pagelinks-bound', '1');
            function preventLinkNav(e) {
              var target = e.target;
              var linkEl = null;
              while (target && target !== doc.body) {
                if (target.tagName === 'A') { linkEl = target; break; }
                target = target.parentElement;
              }
              if (!linkEl) return;
              e.preventDefault();
              e.stopPropagation();
              try {
                var ed = (editor.getEditor) ? editor.getEditor() : editor;
                if (!ed || !ed.select) return;
                var wrapper = (ed.DomComponents && ed.DomComponents.getWrapper) ? ed.DomComponents.getWrapper() : (ed.getWrapper ? ed.getWrapper() : null);
                if (!wrapper) return;
                var found = null;
                if (wrapper.find) {
                  var links = wrapper.find('a');
                  for (var i = 0; !found && i < links.length; i++) {
                    try { if (links[i].getEl && links[i].getEl() === linkEl) found = links[i]; } catch(ex) {}
                  }
                }
                if (!found) {
                  (function search(m) {
                    if (found) return;
                    try { if (m.getEl && m.getEl() === linkEl) { found = m; return; } } catch(ex) {}
                    var ch = m.components ? m.components() : [];
                    if (ch.models) ch = ch.models;
                    if (ch) for (var i = 0; i < ch.length; i++) search(ch[i]);
                  })(wrapper);
                }
                if (found) ed.select(found);
              } catch(err) {}
            }
            doc.addEventListener('click', preventLinkNav, true);
            doc.addEventListener('dblclick', preventLinkNav, true);
            doc.body.setAttribute('data-gjs-pagelinks-bound', '1');
            }
            if (doc.body.getAttribute('data-gjs-cms-styles-bound')) return;
            doc.body.setAttribute('data-gjs-cms-styles-bound', '1');
            var style = doc.createElement('style');
            style.textContent = [
              '[data-cms-binding]:hover,[data-cms-block]:hover,[data-cms-field]:hover{outline:1px dashed rgba(147,51,234,0.4) !important;outline-offset:1px;}',
              'html,body{background-color:inherit;}',
              '[data-gjs-type="wrapper"]{background:transparent !important;}'
            ].join('');
            (doc.head || doc.documentElement).appendChild(style);
          });
          function hasCmsBinding(comp) {
            if (!comp) return false;
            var attrs = comp.getAttributes ? comp.getAttributes() : (comp.attributes || {});
            return !!(attrs['data-cms-binding'] || attrs['data-cms-block'] || attrs['data-cms-field']);
          }
          function updateLayerCmsForComponent(comp) {
            if (!comp) return;
            var layerView = (comp.view && comp.view.parentView) || (comp._layerView);
            var el = layerView && layerView.el;
            if (!el) {
              var cid = comp.getId ? comp.getId() : (comp.id || comp.cid);
              if (cid) {
                var found = document.querySelector('[data-id="' + cid + '"], [data-layer-id="' + cid + '"], [data-cid="' + cid + '"]');
                if (found) el = found.closest('.gjs-layer') || found.closest('[class*="layer"]') || found;
              }
            }
            if (!el && comp.__layerEl) el = comp.__layerEl;
            if (el) {
              if (hasCmsBinding(comp)) { el.setAttribute('data-has-cms-binding', '1'); comp.__layerEl = el; }
              else { el.removeAttribute('data-has-cms-binding'); comp.__layerEl = null; }
            }
            var comps = comp.components || (comp.get && comp.get('components'));
            if (Array.isArray(comps)) comps.forEach(updateLayerCmsForComponent);
          }
          function markSelectedLayerIfCms() {
            var sel = editor.getSelected();
            if (!sel || !hasCmsBinding(sel)) return;
            var layersContainer = document.querySelector('.gjs-layers, [class*="layers"], [class*="Layers"]');
            if (!layersContainer) return;
            var selected = layersContainer.querySelector('.gjs-selected, [class*="selected"]');
            if (selected) {
              var row = selected.closest('.gjs-layer') || selected.closest('[class*="layer"]') || selected.closest('[class*="Layer"]') || selected;
              if (row) row.setAttribute('data-has-cms-binding', '1');
            }
          }
          function refreshAllLayerCms() {
            var root = editor.Layers && editor.Layers.getRoot && editor.Layers.getRoot();
            if (root) updateLayerCmsForComponent(root);
          }
          editor.on('component:selected', function(ev) {
            var comp = ev && ev.component;
            if (comp) { updateLayerCmsForComponent(comp); setTimeout(markSelectedLayerIfCms, 50); }
          });
          editor.on('component:update', function(ev) {
            var comp = ev && ev.component;
            if (comp && hasCmsBinding(comp)) updateLayerCmsForComponent(comp);
          });
          editor.on('layer:update', refreshAllLayerCms);
          editor.on('layer:component', function(comp) {
            if (comp) { updateLayerCmsForComponent(comp); setTimeout(markSelectedLayerIfCms, 50); }
          });
          setTimeout(refreshAllLayerCms, 500);
          setTimeout(refreshAllLayerCms, 1500);
          (function addCmsSettingsPanel() {
            var CMS_BINDINGS = [
              { id: '', name: '— None —' },
              { id: 'events.name', name: 'Events → Name' },
              { id: 'events.description', name: 'Events → Description' },
              { id: 'events.image_url', name: 'Events → Image URL' },
              { id: 'events.start_at', name: 'Events → Start Date' },
              { id: 'events.venue_name', name: 'Events → Location' },
              { id: 'events.category', name: 'Events → Category' },
              { id: 'events.url', name: 'Events → URL' },
              { id: 'featured_sermon.title', name: 'Featured Sermon → Title' },
              { id: 'featured_sermon.tag', name: 'Featured Sermon → Tag' },
              { id: 'featured_sermon.description', name: 'Featured Sermon → Description' },
              { id: 'featured_sermon.image_url', name: 'Featured Sermon → Image URL' },
              { id: 'featured_sermon.video_url', name: 'Featured Sermon → Video URL' },
              { id: 'featured_sermon.audio_url', name: 'Featured Sermon → Audio URL' },
              { id: 'featured_sermon.speaker_name', name: 'Featured Sermon → Speaker' },
              { id: 'podcast.title', name: 'Podcast → Title' },
              { id: 'podcast.description', name: 'Podcast → Description' },
              { id: 'podcast.spotify_url', name: 'Podcast → Spotify URL' },
              { id: 'podcast.apple_podcasts_url', name: 'Podcast → Apple URL' },
              { id: 'podcast_episodes.episode_number', name: 'Podcast Episode → Number' },
              { id: 'podcast_episodes.title', name: 'Podcast Episode → Title' },
              { id: 'podcast_episodes.published_at', name: 'Podcast Episode → Date' },
              { id: 'podcast_episodes.duration_minutes', name: 'Podcast Episode → Duration' },
              { id: 'worship_recordings.title', name: 'Worship → Title' },
              { id: 'worship_recordings.subtitle', name: 'Worship → Subtitle' },
              { id: 'worship_recordings.url', name: 'Worship → URL' },
              { id: 'sermon_archive.title', name: 'Sermon Archive → Title' },
              { id: 'sermon_archive.tag', name: 'Sermon Archive → Tag' },
              { id: 'sermon_archive.image_url', name: 'Sermon Archive → Image URL' },
              { id: 'sermon_archive.published_at', name: 'Sermon Archive → Date' },
              { id: 'sermon_archive.duration_minutes', name: 'Sermon Archive → Duration' },
              { id: 'sermon_archive.speaker_name', name: 'Sermon Archive → Speaker' },
              { id: 'sermon_archive.video_url', name: 'Sermon Archive → Video URL' },
              { id: 'sermon_archive.audio_url', name: 'Sermon Archive → Audio URL' }
            ];
            var panel = document.createElement('div');
            panel.className = 'gjs-cms-settings-panel';
            panel.style.cssText = 'padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.08);background:linear-gradient(180deg,rgba(147,51,234,0.06) 0%,transparent 100%);';
            panel.innerHTML = '<div style="font-size:11px;font-weight:700;color:#9333ea;letter-spacing:0.5px;margin-bottom:8px;text-transform:uppercase;">Bind to CMS</div><select class="gjs-cms-panel-select" style="width:100%;padding:8px 10px;border:1px solid rgba(147,51,234,0.4);border-radius:6px;font-size:13px;background:white;color:#333;">' + CMS_BINDINGS.map(function(o){return '<option value="'+o.id+'">'+o.name+'</option>';}).join('') + '</select>';
            var sel = panel.querySelector('select');
            sel.onchange = function() {
              var comp = editor.getSelected && editor.getSelected();
              if (!comp) return;
              var v = sel.value || '';
              var attrs = (comp.getAttributes && comp.getAttributes()) || {};
              if (attrs['data-cms-field']) comp.addAttributes({ 'data-cms-field': v || undefined });
              else comp.addAttributes({ 'data-cms-binding': v || undefined });
            };
            function updatePanel() {
              var comp = editor.getSelected && editor.getSelected();
              if (comp) {
                var attrs = (comp.getAttributes && comp.getAttributes()) || {};
                var val = attrs['data-cms-binding'] || attrs['data-cms-field'] || '';
                sel.value = val;
                panel.style.display = 'block';
              } else {
                panel.style.display = 'none';
              }
            }
            editor.on('component:selected', updatePanel);
            editor.on('component:update', updatePanel);
            editor.on('component:deselect', function() { panel.style.display = 'none'; });
            function injectPanel() {
              if (document.querySelector('.gjs-cms-settings-panel')) return;
              var pn = editor.Panels;
              var target = null;
              if (pn && pn.getPanel) {
                var viewsPanel = pn.getPanel('views') || pn.getPanel('options') || pn.getPanel('views-container');
                if (viewsPanel && viewsPanel.view && viewsPanel.view.el) {
                  target = viewsPanel.view.el;
                }
              }
              if (!target) {
                target = document.querySelector('.gjs-pn-views, .gjs-pn-views-container, [class*="pn-views"], [class*="views-container"], .gjs-pn-options');
              }
              if (!target && document.getElementById('studio')) {
                var studio = document.getElementById('studio');
                var rightArea = studio.querySelector('[class*="right"], [class*="Right"], [class*="panel"], [class*="Panel"], [class*="sidebar"], [class*="Sidebar"], [class*="properties"], [class*="Properties"]');
                target = rightArea || studio.querySelector('div > div') || studio;
              }
              if (target) {
                panel.style.display = 'none';
                target.insertBefore(panel, target.firstChild);
              }
            }
            setTimeout(injectPanel, 500);
            setTimeout(injectPanel, 1500);
            setTimeout(injectPanel, 3500);
          })();
        });
        document.getElementById('project-selector').style.display = 'none';
        document.getElementById('template-picker').style.display = 'none';
        document.getElementById('studio').style.display = 'block';
        var editorTimeout = setTimeout(function() {
          document.getElementById('studio').innerHTML = '<div style="padding:40px;font-family:sans-serif;text-align:center;max-width:400px;margin:40px auto;"><p style="color:#dc2626;margin-bottom:12px;">Editor is taking too long. The template may be too complex.</p><p style="color:hsl(215,16%,47%);font-size:14px;margin-bottom:20px;">Try reloading and choosing the <strong>Blank</strong> template first.</p><button onclick="location.reload()" style="padding:10px 20px;background:hsl(160,84%,39%);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Reload</button></div>';
        }, 15000);
        createStudioEditor(opts).then(function(result) {
          var ed = result && (result.editor || result);
          if (ed && typeof ed.getHtml === 'function' && !editorInstance) editorInstance = ed;
          clearTimeout(editorTimeout);
          (function removeBranding() {
            var hideCSS = '.gs-banner,.gs-utl-card.gs-banner,[class*="gs-banner"],a.gs-link[href*="grapesjs.com"]{display:none!important;width:0!important;height:0!important;overflow:hidden!important;position:absolute!important;clip:rect(0,0,0,0)!important;}';
            if (!document.querySelector('style[data-hide-badge]')) {
              var s = document.createElement('style');
              s.setAttribute('data-hide-badge','1');
              s.textContent = hideCSS;
              document.head.appendChild(s);
            }
            function nukeNodes() {
              document.querySelectorAll('.gs-banner,[class*="gs-banner"]').forEach(function(el){el.remove();});
            }
            nukeNodes();
            var mo = new MutationObserver(function(mutations) {
              for (var i = 0; i < mutations.length; i++) {
                var added = mutations[i].addedNodes;
                for (var j = 0; j < added.length; j++) {
                  var n = added[j];
                  if (n.nodeType !== 1) continue;
                  if (n.classList && (n.classList.contains('gs-banner') || n.className.indexOf('gs-banner') >= 0)) { n.remove(); continue; }
                  var inner = n.querySelectorAll ? n.querySelectorAll('.gs-banner,[class*="gs-banner"]') : [];
                  inner.forEach(function(el){el.remove();});
                }
              }
            });
            mo.observe(document.documentElement, { childList: true, subtree: true });
            setTimeout(nukeNodes, 500);
            setTimeout(nukeNodes, 2000);
            setTimeout(nukeNodes, 5000);
          })();
        }).catch(function(err) {
          clearTimeout(editorTimeout);
          console.error('GrapeJS init error:', err);
          document.getElementById('studio').innerHTML = '<div style="padding:40px;font-family:sans-serif;text-align:center;"><p style="color:#dc2626;margin-bottom:16px;">Editor failed to load. Try choosing a template again.</p><button onclick="location.reload()" style="padding:10px 20px;background:hsl(160,84%,39%);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Reload</button></div>';
        });
      }

      function hasProjectContent(p) {
        if (!p) return false;
        var pages = p.pages || (p.default && p.default.pages) || (p.data && p.data.pages) || [];
        if (pages.length === 0) {
          if (p.html && typeof p.html === 'string' && p.html.length > 50) return true;
          return false;
        }
        return pages.some(function(page) {
          var c = page.component || page.html;
          if (typeof c === 'string') return c.length > 50;
          return !!c;
        });
      }

      function showProjectSelector() {
        document.getElementById('studio').style.display = 'none';
        document.getElementById('template-picker').style.display = 'none';
        document.getElementById('project-selector').style.display = 'block';
        if (window.parent !== window) window.parent.postMessage({ type: 'editor-project-unloaded' }, '*');
      }

      function showTemplatePicker() {
        document.getElementById('studio').style.display = 'none';
        document.getElementById('project-selector').style.display = 'none';
        document.getElementById('template-picker').style.display = 'block';
        if (window.parent !== window) window.parent.postMessage({ type: 'editor-project-unloaded' }, '*');
      }

      function renderProjectCards(projects) {
        var container = document.getElementById('project-cards');
        container.innerHTML = '';
        var esc = function(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;'); };
        function getPreviewHtml(proj) {
          var p = proj.project || {};
          if (typeof p.previewHtml === 'string' && p.previewHtml.length > 50) {
            return p.previewHtml.length > 50000 ? p.previewHtml.substring(0, 50000) : p.previewHtml;
          }
          try {
            var pages = p.pages || (p.default && p.default.pages) || [];
            var first = Array.isArray(pages) ? pages[0] : null;
            var comp = first && (first.component || first.html);
            if (typeof comp === 'string' && comp.length > 100) {
              var idx = comp.indexOf('<body');
              var start = idx >= 0 ? comp.indexOf('>', idx) + 1 : 0;
              var end = comp.indexOf('</body>', start);
              var body = end >= 0 ? comp.slice(start, end) : comp.slice(start, start + 600);
              var snip = (body || comp).substring(0, 600);
              return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}body{font-family:Inter,sans-serif;background:#f8fafc;padding:12px;font-size:11px;color:#334155;overflow:hidden}</style></head><body>' + snip + '</body></html>';
            }
          } catch (_) {}
          return '<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Inter,sans-serif;color:#64748b;font-size:14px;"><div style="font-weight:600;color:#334155;margin-bottom:8px;">' + (proj.name || 'Project') + '</div><div style="font-size:12px;">Edit and save to generate preview</div></body></html>';
        }
        projects.forEach(function(p) {
          var card = document.createElement('div');
          card.style.cssText = 'background:#fff;border:1px solid hsl(220,13%,91%);border-radius:12px;overflow:hidden;cursor:pointer;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.06);position:relative;';
          card.onmouseover = function() { card.style.borderColor = 'hsl(160,84%,39%)'; card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; };
          card.onmouseout = function() { card.style.borderColor = 'hsl(220,13%,91%)'; card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; };
          var previewHtml = getPreviewHtml(p);
          var isPublished = orgStatus.publishedProjectId === p.id;
          var previewHref = orgStatus.siteUrl ? orgStatus.siteUrl + (orgStatus.siteUrl.indexOf('?') >= 0 ? '&' : '?') + 'preview=' + encodeURIComponent(p.id) : '#';
          var publishLabel = isPublished ? 'Unpublish' : (orgStatus.hasCustomDomain ? 'Publish to domain' : 'Publish preview');
          var publishBg = isPublished ? '#94a3b8' : (orgStatus.hasCustomDomain ? 'hsl(160,84%,39%)' : '#3b82f6');
          var cardActions = '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;"><a href="' + esc(previewHref) + '" target="_blank" rel="noopener noreferrer" class="project-preview-btn" style="padding:6px 12px;font-size:12px;font-weight:600;color:hsl(222,47%,11%);background:#f1f5f9;border-radius:6px;text-decoration:none;">Preview</a><button type="button" class="project-publish-btn" data-id="' + esc(p.id) + '" style="padding:6px 12px;font-size:12px;font-weight:600;border:none;border-radius:6px;cursor:pointer;background:' + publishBg + ';color:white;">' + publishLabel + '</button></div>';
          card.innerHTML = '<div style="height:140px;background:#f1f5f9;overflow:hidden;position:relative;"><iframe srcdoc="' + esc(previewHtml) + '" style="width:200%;height:400%;min-height:560px;border:none;transform:scale(0.5);transform-origin:0 0;pointer-events:none;position:absolute;top:0;left:0;" title="Preview"></iframe></div><div style="padding:16px;"><div style="font-size:15px;font-weight:600;color:hsl(222,47%,11%);margin-bottom:4px;">' + esc(p.name) + '</div><div style="font-size:12px;color:hsl(215,16%,47%);">Updated ' + (p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '') + '</div>' + cardActions + '<button type="button" class="project-delete-btn" data-id="' + esc(p.id) + '" style="position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:6px;border:none;background:rgba(0,0,0,0.5);color:white;cursor:pointer;font-size:14px;line-height:1;opacity:0.7;" title="Delete project">×</button></div>';
          card.onclick = function(ev) {
            if (ev.target.classList.contains('project-delete-btn') || ev.target.classList.contains('project-publish-btn') || ev.target.classList.contains('project-preview-btn')) return;
            card.style.pointerEvents = 'none';
            card.querySelector('div:last-child').innerHTML = '<span style="color:hsl(215,16%,47%);">Opening...</span>';
            fetch('/api/website-builder/project?organizationId=' + encodeURIComponent(organizationId) + '&id=' + encodeURIComponent(p.id), { credentials: 'include' })
              .then(function(r) { return r.json(); })
              .then(async function(data) {
                if (data.project) await initEditor(data.project, p.id);
                else throw new Error('No project');
              })
              .catch(function(err) {
                console.error(err);
                card.style.pointerEvents = 'auto';
                card.querySelector('div:last-child').innerHTML = '<div style="font-size:15px;font-weight:600;color:hsl(222,47%,11%);">' + esc(p.name) + '</div><div style="font-size:12px;color:hsl(215,16%,47%);">Updated ' + (p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '') + '</div>';
              });
          };
          card.querySelector('.project-delete-btn').onclick = function(ev) {
            ev.stopPropagation();
            if (!confirm('Delete this project? This cannot be undone.')) return;
            var btn = ev.target;
            btn.disabled = true;
            fetch('/api/website-builder/project?id=' + encodeURIComponent(p.id) + '&organizationId=' + encodeURIComponent(organizationId), { method: 'DELETE', credentials: 'include' })
              .then(function(r) {
                if (r.ok) { card.remove(); }
                else { btn.disabled = false; }
              })
              .catch(function() { btn.disabled = false; });
          };
          var pubBtn = card.querySelector('.project-publish-btn');
          if (pubBtn) {
            pubBtn.onclick = function(ev) {
              ev.stopPropagation();
              ev.preventDefault();
              var btn = ev.target;
              var unpublish = orgStatus.publishedProjectId === p.id;
              btn.disabled = true;
              fetch('/api/organization-website/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: organizationId, projectId: p.id, unpublish: unpublish }),
                credentials: 'include'
              }).then(function(r) { return r.json(); }).then(function(data) {
                if (data.ok) {
                  orgStatus.publishedProjectId = unpublish ? null : p.id;
                  fetch('/api/organization-website/status?organizationId=' + encodeURIComponent(organizationId), { credentials: 'include' })
                    .then(function(r2) { return r2.json(); })
                    .then(function(s) {
                      if (s.publishedUrl) orgStatus.publishedUrl = s.publishedUrl;
                      if (s.siteUrl) orgStatus.siteUrl = s.siteUrl;
                      orgStatus.hasCustomDomain = s.hasCustomDomain || false;
                      orgStatus.customDomain = s.customDomain || null;
                      var mode = orgStatus.hasCustomDomain ? 'domain' : 'preview';
                      if (window.parent !== window) {
                        window.parent.postMessage({ type: 'site-published', published: !unpublish, publishedUrl: orgStatus.publishedUrl || orgStatus.siteUrl || null, publishMode: mode }, '*');
                      }
                      renderProjectCards(projects);
                    }).catch(function() {
                      var mode = orgStatus.hasCustomDomain ? 'domain' : 'preview';
                      if (window.parent !== window) {
                        window.parent.postMessage({ type: 'site-published', published: !unpublish, publishedUrl: orgStatus.publishedUrl || orgStatus.siteUrl || null, publishMode: mode }, '*');
                      }
                      renderProjectCards(projects);
                    });
                }
                btn.disabled = false;
              }).catch(function() { btn.disabled = false; });
            };
          }
          container.appendChild(card);
        });
        var plusCard = document.createElement('div');
        plusCard.style.cssText = 'background:#fff;border:2px dashed hsl(220,13%,91%);border-radius:12px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;min-height:180px;';
        plusCard.onmouseover = function() { plusCard.style.borderColor = 'hsl(160,84%,39%)'; plusCard.style.background = 'hsl(160,84%,97%)'; };
        plusCard.onmouseout = function() { plusCard.style.borderColor = 'hsl(220,13%,91%)'; plusCard.style.background = '#fff'; };
        plusCard.innerHTML = '<div style="text-align:center;color:hsl(215,16%,47%);"><div style="font-size:48px;line-height:1;margin-bottom:8px;">+</div><div style="font-size:14px;font-weight:600;">New project</div><div style="font-size:12px;">Choose a template</div></div>';
        plusCard.onclick = function() { showTemplatePicker(); renderTemplateCards(); };
        container.appendChild(plusCard);
      }

      function renderTemplateCards() {
        var container = document.getElementById('template-cards');
        container.innerHTML = '';
        fetch('/api/website-builder/templates', { credentials: 'include' })
          .then(function(r) { return r.json(); })
          .then(function(templates) {
            if (!templates.length) {
              container.innerHTML = '<p style="color:hsl(215,16%,47%);">No templates available.</p>';
              return;
            }
            var esc = function(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;'); };
            templates.forEach(function(t) {
              var card = document.createElement('div');
              card.style.cssText = 'background:#fff;border:1px solid hsl(220,13%,91%);border-radius:12px;overflow:hidden;cursor:pointer;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.06);';
              card.onmouseover = function() { card.style.borderColor = 'hsl(160,84%,39%)'; card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; };
              card.onmouseout = function() { card.style.borderColor = 'hsl(220,13%,91%)'; card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; };
              var previewHtml = t.previewHtml ? '<div style="height:140px;background:#f8fafc;overflow:hidden;"><iframe srcdoc="' + esc(t.previewHtml) + '" style="width:200%;height:200%;border:none;transform:scale(0.5);transform-origin:0 0;pointer-events:none;" title="Preview"></iframe></div>' : '<div style="height:140px;background:linear-gradient(135deg,#f1f5f9 0%,#e2e8f0 100%);display:flex;align-items:center;justify-content:center;"><span style="color:#94a3b8;font-size:14px;">No preview</span></div>';
              card.innerHTML = previewHtml + '<div style="padding:20px;"><div style="font-size:16px;font-weight:600;color:hsl(222,47%,11%);margin-bottom:6px;">' + (t.name || t.id) + '</div><div style="font-size:13px;color:hsl(215,16%,47%);line-height:1.5;">' + (t.description || '') + '</div></div>';
              card.onclick = async function() {
                card.style.pointerEvents = 'none';
                card.querySelector('div:last-child').innerHTML = '<span style="color:hsl(215,16%,47%);">Creating...</span>';
                try {
                  var tr = await fetch('/api/website-builder/templates/' + encodeURIComponent(t.id), { credentials: 'include' });
                  var td = await tr.json();
                  if (!td.project) throw new Error('No project');
                  var proj = td.project;
                  var previewHtml = td.previewHtml || null;
                  if (!previewHtml && proj.pages && proj.pages[0] && typeof proj.pages[0].component === 'string') {
                    var comp = proj.pages[0].component;
                    previewHtml = comp.indexOf('<!DOCTYPE') >= 0 || comp.indexOf('<html') >= 0 ? comp : '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' + comp + '</body></html>';
                  }
                  var saveBody = { organizationId: organizationId, project: proj };
                  if (previewHtml) saveBody.previewHtml = previewHtml;
                  var saveRes = await fetch('/api/website-builder/project', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(saveBody),
                    credentials: 'include'
                  });
                  var saveData = await saveRes.json();
                  if (!saveRes.ok) throw new Error(saveData.error || 'Save failed');
                  await initEditor(td.project, saveData.id);
                } catch (err) {
                  console.error(err);
                  card.style.pointerEvents = 'auto';
                  card.querySelector('div:last-child').innerHTML = '<div style="font-size:16px;font-weight:600;color:hsl(222,47%,11%);">' + (t.name || t.id) + '</div><div style="font-size:13px;color:hsl(215,16%,47%);">' + (t.description || '') + '</div><div style="color:#dc2626;font-size:12px;margin-top:8px;">Failed. Try again.</div>';
                }
              };
              container.appendChild(card);
            });
          })
          .catch(function() { container.innerHTML = '<p style="color:#dc2626;">Failed to load templates.</p>'; });
      }

      document.getElementById('template-back-btn').onclick = function() {
        showProjectSelector();
        fetch('/api/website-builder/projects?organizationId=' + encodeURIComponent(organizationId), { credentials: 'include' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            var projects = (data && data.projects) ? data.projects : (window.__projectsList || []);
            window.__projectsList = projects;
            renderProjectCards(projects);
          })
          .catch(function() { renderProjectCards(window.__projectsList || []); });
      };

      (async function main() {
        try {
          var statusRes = await fetch('/api/organization-website/status?organizationId=' + encodeURIComponent(organizationId), { credentials: 'include' });
          var statusData = await statusRes.json();
          if (statusData.siteUrl) orgStatus.siteUrl = statusData.siteUrl;
          if (statusData.publishedUrl) orgStatus.publishedUrl = statusData.publishedUrl;
          if (statusData.publishedProjectId) orgStatus.publishedProjectId = statusData.publishedProjectId;
          orgStatus.hasCustomDomain = statusData.hasCustomDomain || false;
          orgStatus.customDomain = statusData.customDomain || null;
        } catch (_) {}

        // Show org name in project list heading so users know which account they're editing
        if (orgName) {
          var heading = document.getElementById('project-heading');
          var subheading = document.getElementById('project-subheading');
          if (heading) heading.textContent = orgName + ' — Website Projects';
          if (subheading) subheading.textContent = 'These projects belong to your account. Open one to edit, or create a new one from a template.';
        }

        var timeout = setTimeout(function() {
          if (document.getElementById('loading-overlay').style.display !== 'none') {
            hideLoading();
            document.getElementById('project-cards').innerHTML = '<p style="color:hsl(215,16%,47%);grid-column:1/-1;">Loading took too long. <a href="#" onclick="location.reload()" style="color:hsl(160,84%,39%);">Refresh</a> to try again.</p>';
            var plusCard = document.createElement('div');
            plusCard.style.cssText = 'background:#fff;border:2px dashed hsl(220,13%,91%);border-radius:12px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;min-height:180px;';
            plusCard.onmouseover = function() { plusCard.style.borderColor = 'hsl(160,84%,39%)'; plusCard.style.background = 'hsl(160,84%,97%)'; };
            plusCard.onmouseout = function() { plusCard.style.borderColor = 'hsl(220,13%,91%)'; plusCard.style.background = '#fff'; };
            plusCard.innerHTML = '<div style="text-align:center;color:hsl(215,16%,47%);"><div style="font-size:48px;line-height:1;margin-bottom:8px;">+</div><div style="font-size:14px;font-weight:600;">New project</div></div>';
            plusCard.onclick = function() { showTemplatePicker(); renderTemplateCards(); };
            document.getElementById('project-cards').appendChild(plusCard);
            showProjectSelector();
          }
        }, 12000);

        try {
          var controller = new AbortController();
          var fetchTimeout = setTimeout(function() { controller.abort(); }, 8000);
          var r = await fetch('/api/website-builder/projects?organizationId=' + encodeURIComponent(organizationId), { credentials: 'include', signal: controller.signal });
          clearTimeout(fetchTimeout);
          var data = await r.json();
          var projects = (r.ok && data && data.projects) ? data.projects : [];
          window.__projectsList = projects;
          clearTimeout(timeout);
          hideLoading();
          renderProjectCards(projects);
          showProjectSelector();
        } catch (e) {
          console.warn('Load projects:', e);
          clearTimeout(timeout);
          hideLoading();
          window.__projectsList = [];
          document.getElementById('project-cards').innerHTML = '<p style="color:#dc2626;">Failed to load projects. <a href="#" onclick="location.reload()" style="color:hsl(160,84%,39%);">Refresh</a></p>';
          showProjectSelector();
        }
      })();
    })();
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (e) {
    console.error("editor-frame error:", e);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
}
