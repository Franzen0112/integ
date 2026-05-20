/**
 * Site images: local images/ folder (extracted zip) + optional Supabase override
 */
(function() {
  'use strict';

  var BUCKET = 'jjrk-images';

  /** Local paths after extracting images-*.zip into project root /images */
  var IMAGE_FALLBACKS = {
    studio_main: 'images/jjrk.png',
    product_wedding_basic: 'images/wedding.jpg',
    product_wedding_premium: 'images/family portraits.png',
    product_event_standard: 'images/Event Coverage Standard.jpg',
    product_event_premium: 'images/Event Coverage Premium.avif',
    product_photobooth_basic: 'images/Photo Booth.jpg',
    product_photobooth_deluxe: 'images/Photo Booth Deluxe.jpg',
    service_wedding: 'images/wedding.jpg',
    service_event: 'images/Event Videography.png',
    service_photobooth: 'images/Photo Booth.jpg'
  };

  var FALLBACK_CATALOG = [
    { slug: 'team_ronie', category: 'team', title: 'Ronie Manaongsong', subtitle: 'CEO & Founder',
      description: 'Ronie leads JJRK Studio with a clear vision for quality and client satisfaction.', sort_order: 1 },
    { slug: 'team_kim', category: 'team', title: 'Kim Duenas', subtitle: 'Lead Photographer',
      description: 'Kim specializes in capturing authentic moments with sharp composition and natural lighting.', sort_order: 2 },
    { slug: 'team_drowmar', category: 'team', title: 'Drowmar Vincullado', subtitle: 'Lead Videographer',
      description: 'Drowmar creates cinematic video content with smooth motion and strong storytelling.', sort_order: 3 },
    { slug: 'team_franzen', category: 'team', title: 'Franzen Libradilla', subtitle: 'Media & Web Specialist',
      description: 'Franzen supports the studio\'s digital side—website, booking, and media systems.', sort_order: 4 },
    { slug: 'team_dec', category: 'team', title: 'Dec Bucong', subtitle: 'Senior Photo & Video Editor',
      description: 'Dec brings photos and footage to life through color grading and precise cuts.', sort_order: 5 },
    { slug: 'product_wedding_basic', category: 'product', title: 'Wedding Package Basic', subtitle: 'Wedding Packages',
      description: 'Essential photo & video coverage for your wedding day.', sort_order: 10 },
    { slug: 'product_wedding_premium', category: 'product', title: 'Wedding Package Premium', subtitle: 'Wedding Packages',
      description: 'Comprehensive photo & video coverage with premium features.', sort_order: 11 },
    { slug: 'product_event_standard', category: 'product', title: 'Event Coverage Standard', subtitle: 'Event Packages',
      description: 'High-quality photography & videography for special occasions.', sort_order: 20 },
    { slug: 'product_event_premium', category: 'product', title: 'Event Coverage Premium', subtitle: 'Event Packages',
      description: 'Premium event coverage with extended hours and multiple cameras.', sort_order: 21 },
    { slug: 'product_photobooth_basic', category: 'product', title: 'Photo Booth Basic', subtitle: 'Photo Booth Rental',
      description: 'Fun and interactive photo booth setup for your parties.', sort_order: 30 },
    { slug: 'product_photobooth_deluxe', category: 'product', title: 'Photo Booth Deluxe', subtitle: 'Photo Booth Rental',
      description: 'Premium photo booth with props and custom backgrounds.', sort_order: 31 },
    { slug: 'service_wedding', category: 'service', title: 'Wedding Photography', subtitle: 'Services',
      description: 'Professional wedding photography services.', sort_order: 40 },
    { slug: 'service_event', category: 'service', title: 'Event Videography', subtitle: null,
      description: 'Professional videography for celebrations.', sort_order: 41 },
    { slug: 'service_photobooth', category: 'service', title: 'Photo Booth Rental', subtitle: null,
      description: 'Photo booth rental for events.', sort_order: 42 },
    { slug: 'studio_main', category: 'studio', title: 'JJRK Studio', subtitle: null,
      description: 'Our studio facility.', sort_order: 50 }
  ];

  function getSupabase() {
    return window.supabaseClient || null;
  }

  function getLocalFallback(slug) {
    return IMAGE_FALLBACKS[slug] || null;
  }

  function resolveImageUrl(record) {
    if (!record) return null;
    if (record.image_url) return record.image_url;
    return getLocalFallback(record.slug) || record.local_fallback || null;
  }

  function mergeWithFallbacks(rows) {
    var bySlug = {};
    (rows || []).forEach(function(r) { bySlug[r.slug] = r; });
    return FALLBACK_CATALOG.map(function(base) {
      var row = bySlug[base.slug];
      if (!row) {
        return Object.assign({}, base, {
          local_fallback: getLocalFallback(base.slug),
          image_url: null
        });
      }
      return Object.assign({}, base, row, {
        local_fallback: getLocalFallback(row.slug)
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

  async function getImagesByCategory(category) {
    var supabase = getSupabase();
    if (!supabase) {
      var all = mergeWithFallbacks([]);
      if (category) {
        all = all.filter(function(r) { return r.category === category; });
      }
      return { data: all, error: null };
    }

    var q = supabase.from('site_images').select('*').eq('is_active', true).order('sort_order', { ascending: true });
    if (category) q = q.eq('category', category);

    var res = await q;
    if (res.error) {
      console.warn('site_images:', res.error.message);
      var fallback = mergeWithFallbacks([]);
      if (category) fallback = fallback.filter(function(r) { return r.category === category; });
      return { data: fallback, error: null };
    }
    return { data: mergeWithFallbacks(res.data || []), error: null };
  }

  async function getAllImagesAdmin() {
    var supabase = getSupabase();
    if (!supabase) {
      return { data: mergeWithFallbacks([]), error: null };
    }
    var res = await supabase.from('site_images').select('*').order('category').order('sort_order', { ascending: true });
    if (res.error) {
      return { data: mergeWithFallbacks([]), error: res.error };
    }
    if (!res.data || !res.data.length) {
      return { data: mergeWithFallbacks([]), error: null };
    }
    return { data: mergeWithFallbacks(res.data), error: null };
  }

  async function getImageBySlug(slug) {
    var supabase = getSupabase();
    if (!supabase) {
      var found = FALLBACK_CATALOG.find(function(r) { return r.slug === slug; });
      return { data: found ? mergeWithFallbacks([found])[0] : null, error: null };
    }
    var res = await supabase.from('site_images').select('*').eq('slug', slug).maybeSingle();
    if (res.error || !res.data) {
      var fb = FALLBACK_CATALOG.find(function(r) { return r.slug === slug; });
      return { data: fb ? mergeWithFallbacks([fb])[0] : null, error: res.error };
    }
    return { data: mergeWithFallbacks([res.data])[0], error: null };
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

  function applyImageToElement(el, record) {
    if (!el || !record) return;
    var url = resolveImageUrl(record);
    if (url) {
      el.src = url;
      el.alt = record.title || el.alt || '';
      el.onerror = function() {
        var fb = el.getAttribute('data-fallback-src');
        if (fb && el.src !== fb) el.src = fb;
      };
    }
  }

  async function loadImagesIntoPage() {
    var slugs = document.querySelectorAll('[data-image-slug]');
    if (!slugs.length) return;

    try { await ensureSupabaseReady(); } catch (e) { /* use local only */ }

    var res = await getImagesByCategory(null);
    var bySlug = {};
    (res.data || []).forEach(function(row) { bySlug[row.slug] = row; });

    slugs.forEach(function(el) {
      var slug = el.getAttribute('data-image-slug');
      var staticSrc = el.getAttribute('src') || el.getAttribute('data-fallback-src');
      if (staticSrc) el.setAttribute('data-fallback-src', staticSrc);
      if (slug && bySlug[slug]) {
        applyImageToElement(el, bySlug[slug]);
      } else if (slug && getLocalFallback(slug) && !el.getAttribute('src')) {
        el.src = getLocalFallback(slug);
      }
    });
  }

  function renderTeamCard(member) {
    var url = resolveImageUrl(member);
    var initials = initialsFromTitle(member.title);
    var photoHtml = url
      ? '<img src="' + escapeHtml(url) + '" alt="' + escapeHtml(member.title) + '" class="team-photo" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling&&(this.nextElementSibling.style.display=\'flex\')">' +
        '<div class="team-avatar" aria-hidden="true" style="display:none">' + escapeHtml(initials) + '</div>'
      : '<div class="team-avatar" aria-hidden="true">' + escapeHtml(initials) + '</div>';

    return '<div class="team-card">' + photoHtml +
      '<h3>' + escapeHtml(member.title) + '</h3>' +
      '<p class="team-role">' + escapeHtml(member.subtitle || '') + '</p>' +
      '<p class="team-bio">' + escapeHtml(member.description || '') + '</p></div>';
  }

  async function renderTeamSection(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var res = await getImagesByCategory('team');
    var team = (res.data || []).filter(function(r) { return r.category === 'team'; });
    if (!team.length) team = FALLBACK_CATALOG.filter(function(r) { return r.category === 'team'; });

    container.innerHTML = team.map(renderTeamCard).join('');
  }

  async function ensureSupabaseReady() {
    if (typeof window.waitForSupabase === 'function') await window.waitForSupabase();
    else if (typeof window.initializeSupabaseClient === 'function') window.initializeSupabaseClient();
  }

  window.siteImages = {
    BUCKET: BUCKET,
    IMAGE_FALLBACKS: IMAGE_FALLBACKS,
    FALLBACK_CATALOG: FALLBACK_CATALOG,
    getLocalFallback: getLocalFallback,
    resolveImageUrl: resolveImageUrl,
    mergeWithFallbacks: mergeWithFallbacks,
    getImagesByCategory: getImagesByCategory,
    getAllImagesAdmin: getAllImagesAdmin,
    getImageBySlug: getImageBySlug,
    uploadAndSaveImage: uploadAndSaveImage,
    loadImagesIntoPage: loadImagesIntoPage,
    renderTeamSection: renderTeamSection,
    ensureSupabaseReady: ensureSupabaseReady,
    initialsFromTitle: initialsFromTitle,
    escapeHtml: escapeHtml
  };
})();
