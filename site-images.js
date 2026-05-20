/**
 * Public site images — every file in /images + Supabase site_images (anon can read)
 */
(function() {
  'use strict';

  var BUCKET = 'jjrk-images';

  /** Every image in images/ folder — public fallback_path for Vercel + local */
  var PUBLIC_IMAGE_CATALOG = [
    { slug: 'team_ronie', category: 'team', title: 'Ronie Manaongsong', subtitle: 'CEO & Founder',
      description: 'Ronie leads JJRK Studio with vision and client-focused leadership.', sort_order: 1,
      fallback_path: 'images/Ronie Manaongsong.jpg' },
    { slug: 'team_kim', category: 'team', title: 'Kim Duenas', subtitle: 'Lead Photographer',
      description: 'Kim captures authentic moments with sharp composition and natural light.', sort_order: 2,
      fallback_path: 'images/Kim Duenas.jpg' },
    { slug: 'team_drowmar', category: 'team', title: 'Drowmar Vincullado', subtitle: 'Lead Videographer',
      description: 'Drowmar creates cinematic stories for weddings and events.', sort_order: 3,
      fallback_path: 'images/Drowmar Vinculado.jpg' },
    { slug: 'team_franzen', category: 'team', title: 'Franzen Libradilla', subtitle: 'Media & Web Specialist',
      description: 'Franzen manages the studio website and digital experience.', sort_order: 4,
      fallback_path: 'images/Franzen Libradilla.jpg' },
    { slug: 'team_dec', category: 'team', title: 'Dec Bucong', subtitle: 'Senior Photo & Video Editor',
      description: 'Dec delivers polished photos and videos through expert editing.', sort_order: 5,
      fallback_path: 'images/Dec Rainiel Bucong.jpg' },
    { slug: 'product_wedding_basic', category: 'product', title: 'Wedding Package Basic', subtitle: 'Wedding Packages',
      description: 'Essential photo & video coverage for your wedding day.', sort_order: 10,
      fallback_path: 'images/wedding.jpg' },
    { slug: 'product_wedding_premium', category: 'product', title: 'Wedding Package Premium', subtitle: 'Wedding Packages',
      description: 'Comprehensive photo & video coverage with premium features.', sort_order: 11,
      fallback_path: 'images/family portraits.png' },
    { slug: 'product_event_standard', category: 'product', title: 'Event Coverage Standard', subtitle: 'Event Packages',
      description: 'High-quality photography & videography for special occasions.', sort_order: 20,
      fallback_path: 'images/Event Coverage Standard.jpg' },
    { slug: 'product_event_premium', category: 'product', title: 'Event Coverage Premium', subtitle: 'Event Packages',
      description: 'Premium event coverage with extended hours and multiple cameras.', sort_order: 21,
      fallback_path: 'images/Event Coverage Premium.avif' },
    { slug: 'product_photobooth_basic', category: 'product', title: 'Photo Booth Basic', subtitle: 'Photo Booth Rental',
      description: 'Fun and interactive photo booth setup for your parties.', sort_order: 30,
      fallback_path: 'images/Photo Booth.jpg' },
    { slug: 'product_photobooth_deluxe', category: 'product', title: 'Photo Booth Deluxe', subtitle: 'Photo Booth Rental',
      description: 'Premium photo booth with props and custom backgrounds.', sort_order: 31,
      fallback_path: 'images/Photo Booth Deluxe.jpg' },
    { slug: 'service_wedding', category: 'service', title: 'Wedding Photography', subtitle: 'Services',
      description: 'Professional wedding photography services.', sort_order: 40,
      fallback_path: 'images/wedding.jpg' },
    { slug: 'service_event', category: 'service', title: 'Event Videography', subtitle: null,
      description: 'Professional videography for celebrations.', sort_order: 41,
      fallback_path: 'images/Event Videography.png' },
    { slug: 'service_photobooth', category: 'service', title: 'Photo Booth Rental', subtitle: null,
      description: 'Photo booth rental for events.', sort_order: 42,
      fallback_path: 'images/Photo Booth.jpg' },
    { slug: 'service_portraits', category: 'service', title: 'Studio Portraits', subtitle: null,
      description: 'Portrait sessions in studio or on location.', sort_order: 43,
      fallback_path: 'images/family portraits.png' },
    { slug: 'service_editing', category: 'service', title: 'Video Editing', subtitle: null,
      description: 'Professional video editing and color grading.', sort_order: 44,
      fallback_path: 'images/Video Editing.webp' },
    { slug: 'media_event', category: 'studio', title: 'Event Highlight', subtitle: null,
      description: 'Event photography sample.', sort_order: 45,
      fallback_path: 'images/event.jpg' },
    { slug: 'studio_main', category: 'studio', title: 'JJRK Studio', subtitle: null,
      description: 'Our studio facility.', sort_order: 50,
      fallback_path: 'images/jjrk.png' },
    { slug: 'media_camera', category: 'studio', title: 'Camera Background', subtitle: null,
      description: 'Login and register page background.', sort_order: 51,
      fallback_path: 'images/camera.jpg' },
    { slug: 'dashboard_bg', category: 'studio', title: 'Dashboard Background', subtitle: null,
      description: 'Home dashboard background.', sort_order: 52,
      fallback_path: 'images/camera.jpg' }
  ];

  var IMAGE_FALLBACKS = {};
  PUBLIC_IMAGE_CATALOG.forEach(function(row) {
    if (row.fallback_path) IMAGE_FALLBACKS[row.slug] = row.fallback_path;
  });

  function getSupabase() {
    return window.supabaseClient || null;
  }

  function getLocalFallback(slug, record) {
    if (record && record.fallback_path) return record.fallback_path;
    return IMAGE_FALLBACKS[slug] || null;
  }

  function resolveImageUrl(record) {
    if (!record) return null;
    if (record.image_url) return record.image_url;
    return getLocalFallback(record.slug, record) || null;
  }

  function mergeWithCatalog(rows) {
    var bySlug = {};
    (rows || []).forEach(function(r) { bySlug[r.slug] = r; });
    return PUBLIC_IMAGE_CATALOG.map(function(base) {
      var row = bySlug[base.slug];
      if (!row) {
        return Object.assign({}, base, { image_url: null });
      }
      return Object.assign({}, base, row, {
        fallback_path: row.fallback_path || base.fallback_path
      });
    });
  }

  function initialsFromTitle(title) {
    if (!title) return '?';
    return title.split(/\s+/).map(function(w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function recordForSlug(slug, bySlug) {
    if (bySlug && bySlug[slug]) return bySlug[slug];
    var base = PUBLIC_IMAGE_CATALOG.find(function(r) { return r.slug === slug; });
    return base ? mergeWithCatalog([base])[0] : null;
  }

  async function getImagesByCategory(category) {
    var supabase = getSupabase();
    if (!supabase) {
      var all = mergeWithCatalog([]);
      if (category) all = all.filter(function(r) { return r.category === category; });
      return { data: all, error: null };
    }

    var q = supabase.from('site_images').select('*').eq('is_active', true).order('sort_order', { ascending: true });
    if (category) q = q.eq('category', category);

    var res = await q;
    if (res.error) {
      console.warn('site_images:', res.error.message);
      var fallback = mergeWithCatalog([]);
      if (category) fallback = fallback.filter(function(r) { return r.category === category; });
      return { data: fallback, error: null };
    }
    return { data: mergeWithCatalog(res.data || []), error: null };
  }

  async function getAllImagesAdmin() {
    var supabase = getSupabase();
    if (!supabase) return { data: mergeWithCatalog([]), error: null };
    var res = await supabase.from('site_images').select('*').order('sort_order', { ascending: true });
    if (res.error) return { data: mergeWithCatalog([]), error: res.error };
    return { data: mergeWithCatalog(res.data || []), error: null };
  }

  async function getImageBySlug(slug) {
    var res = await getImagesByCategory(null);
    var found = (res.data || []).find(function(r) { return r.slug === slug; });
    return { data: found || null, error: null };
  }

  async function uploadAndSaveImage(slug, file) {
    var supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Database not ready') };
    if (!file || !slug) return { data: null, error: new Error('Missing file or slug') };

    var rowRes = await getImageBySlug(slug);
    var row = rowRes.data;
    if (!row) return { data: null, error: new Error('Unknown image slot: ' + slug) };

    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    var path = row.category + '/' + slug + '-' + Date.now() + '.' + ext;

    if (row.storage_path) {
      try { await supabase.storage.from(BUCKET).remove([row.storage_path]); } catch (e) { console.warn(e); }
    }

    var uploadRes = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600', upsert: true, contentType: file.type || 'image/jpeg'
    });
    if (uploadRes.error) return { data: null, error: uploadRes.error };

    var publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    return await supabase.from('site_images').update({
      image_url: publicUrl, storage_path: path, updated_at: new Date().toISOString()
    }).eq('slug', slug).select().single();
  }

  function buildLocalBySlug() {
    var bySlug = {};
    PUBLIC_IMAGE_CATALOG.forEach(function(row) {
      bySlug[row.slug] = Object.assign({}, row);
    });
    return bySlug;
  }

  function applyImageToElement(el, record) {
    if (!el || !record) return;
    var local = getLocalFallback(record.slug, record);
    var fb = el.getAttribute('data-fallback-src') || el.getAttribute('src') || local;
    if (fb && !el.getAttribute('data-fallback-src')) {
      el.setAttribute('data-fallback-src', fb);
    }
    if (record.image_url) {
      el.src = record.image_url;
    } else if (local && (!el.getAttribute('src') || el.getAttribute('src').indexOf('http') === 0)) {
      el.src = local;
    }
    if (record.title && !el.getAttribute('alt')) el.alt = record.title;
    el.onerror = function() {
      if (fb && el.src !== fb) el.src = fb;
    };
  }

  function applyBackgroundImages(bySlug) {
    bySlug = bySlug || buildLocalBySlug();
    document.querySelectorAll('[data-image-bg]').forEach(function(el) {
      var slug = el.getAttribute('data-image-bg');
      var rec = recordForSlug(slug, bySlug);
      var url = resolveImageUrl(rec);
      if (!url) return;
      el.style.backgroundImage = "url('" + url.replace(/'/g, '%27') + "')";
      el.style.backgroundSize = el.style.backgroundSize || 'cover';
      el.style.backgroundPosition = el.style.backgroundPosition || 'center';
      el.style.backgroundRepeat = el.style.backgroundRepeat || 'no-repeat';
    });
  }

  function applyHoverImageSlugs(bySlug) {
    document.querySelectorAll('[data-hover-image-slug]').forEach(function(el) {
      var slug = el.getAttribute('data-hover-image-slug');
      var url = resolveImageUrl(recordForSlug(slug, bySlug));
      if (!url) return;
      el.setAttribute('data-hover-image', url);
      var hoverImg = el.querySelector('.hover-image img');
      if (hoverImg) {
        hoverImg.src = url;
        hoverImg.setAttribute('data-image-slug', slug);
      }
    });
  }

  function applyAllLocalImagesNow() {
    var bySlug = buildLocalBySlug();
    document.querySelectorAll('[data-image-slug]').forEach(function(el) {
      var slug = el.getAttribute('data-image-slug');
      applyImageToElement(el, recordForSlug(slug, bySlug));
    });
    applyBackgroundImages(bySlug);
    applyHoverImageSlugs(bySlug);
  }

  async function loadImagesIntoPage() {
    applyAllLocalImagesNow();
    try {
      var res = await getImagesByCategory(null);
      var bySlug = {};
      (res.data || []).forEach(function(row) { bySlug[row.slug] = row; });
      document.querySelectorAll('[data-image-slug]').forEach(function(el) {
        var slug = el.getAttribute('data-image-slug');
        var rec = recordForSlug(slug, bySlug);
        if (rec && rec.image_url) applyImageToElement(el, rec);
      });
      applyBackgroundImages(bySlug);
      applyHoverImageSlugs(bySlug);
    } catch (e) {
      console.warn('Cloud images skipped:', e.message || e);
    }
  }

  function renderTeamCard(member) {
    var url = resolveImageUrl(member);
    var initials = initialsFromTitle(member.title);
    var photoHtml = url
      ? '<img src="' + escapeHtml(url) + '" alt="' + escapeHtml(member.title) + '" class="team-photo" loading="lazy" onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\'">' +
        '<div class="team-avatar" aria-hidden="true" style="display:none">' + escapeHtml(initials) + '</div>'
      : '<div class="team-avatar" aria-hidden="true">' + escapeHtml(initials) + '</div>';

    return '<div class="team-card">' + photoHtml +
      '<h3>' + escapeHtml(member.title) + '</h3>' +
      '<p class="team-role">' + escapeHtml(member.subtitle || '') + '</p>' +
      '<p class="team-bio">' + escapeHtml(member.description || '') + '</p></div>';
  }

  async function renderTeamSection(containerId, forceReplace) {
    var container = document.getElementById(containerId);
    if (!container) return;
    if (!forceReplace && container.querySelector('img.team-photo')) {
      applyAllLocalImagesNow();
      return;
    }
    var res = await getImagesByCategory('team');
    var team = (res.data || []).filter(function(r) { return r.category === 'team'; });
    container.innerHTML = team.map(renderTeamCard).join('');
    applyAllLocalImagesNow();
  }

  async function ensureSupabaseReady() {
    if (typeof window.waitForSupabase === 'function') await window.waitForSupabase();
    else if (typeof window.initializeSupabaseClient === 'function') window.initializeSupabaseClient();
  }

  /** Local images first (instant), then optional Supabase upgrade */
  async function initPublicImagesOnPage() {
    applyAllLocalImagesNow();
    try {
      await ensureSupabaseReady();
      await loadImagesIntoPage();
    } catch (e) {
      console.warn('Supabase optional for images:', e.message || e);
    }
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('jjrk-images-ready', { detail: { count: PUBLIC_IMAGE_CATALOG.length } }));
    }
  }

  function bootLocalImages() {
    applyAllLocalImagesNow();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootLocalImages);
    } else {
      bootLocalImages();
    }
  }

  window.siteImages = {
    BUCKET: BUCKET,
    PUBLIC_IMAGE_CATALOG: PUBLIC_IMAGE_CATALOG,
    IMAGE_FALLBACKS: IMAGE_FALLBACKS,
    FALLBACK_CATALOG: PUBLIC_IMAGE_CATALOG,
    getLocalFallback: getLocalFallback,
    resolveImageUrl: resolveImageUrl,
    mergeWithFallbacks: mergeWithCatalog,
    getImagesByCategory: getImagesByCategory,
    getAllImagesAdmin: getAllImagesAdmin,
    getImageBySlug: getImageBySlug,
    uploadAndSaveImage: uploadAndSaveImage,
    applyAllLocalImagesNow: applyAllLocalImagesNow,
    loadImagesIntoPage: loadImagesIntoPage,
    renderTeamSection: renderTeamSection,
    initPublicImagesOnPage: initPublicImagesOnPage,
    ensureSupabaseReady: ensureSupabaseReady,
    initialsFromTitle: initialsFromTitle,
    escapeHtml: escapeHtml
  };
})();
