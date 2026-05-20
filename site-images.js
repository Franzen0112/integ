/**
 * Site images: Supabase Storage + site_images table
 */
(function() {
  'use strict';

  var BUCKET = 'jjrk-images';

  function getSupabase() {
    return window.supabaseClient || null;
  }

  function initialsFromTitle(title) {
    if (!title) return '?';
    return title
      .split(/\s+/)
      .map(function(w) { return w.charAt(0); })
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function getImagesByCategory(category) {
    var supabase = getSupabase();
    if (!supabase) return { data: [], error: new Error('Database not ready') };

    var q = supabase
      .from('site_images')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (category) {
      q = q.eq('category', category);
    }

    return await q;
  }

  async function getAllImagesAdmin() {
    var supabase = getSupabase();
    if (!supabase) return { data: [], error: new Error('Database not ready') };

    return await supabase
      .from('site_images')
      .select('*')
      .order('category')
      .order('sort_order', { ascending: true });
  }

  async function getImageBySlug(slug) {
    var supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Database not ready') };

    return await supabase
      .from('site_images')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
  }

  async function uploadAndSaveImage(slug, file) {
    var supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Database not ready') };
    if (!file || !slug) return { data: null, error: new Error('Missing file or slug') };

    var rowRes = await getImageBySlug(slug);
    if (rowRes.error) return { data: null, error: rowRes.error };
    if (!rowRes.data) return { data: null, error: new Error('Unknown image slot: ' + slug) };

    var row = rowRes.data;
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    var path = row.category + '/' + slug + '-' + Date.now() + '.' + ext;

    if (row.storage_path) {
      try {
        await supabase.storage.from(BUCKET).remove([row.storage_path]);
      } catch (e) {
        console.warn('Old file remove:', e);
      }
    }

    var uploadRes = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg'
    });

    if (uploadRes.error) {
      return { data: null, error: uploadRes.error };
    }

    var publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    var updateRes = await supabase
      .from('site_images')
      .update({
        image_url: publicUrl,
        storage_path: path,
        updated_at: new Date().toISOString()
      })
      .eq('slug', slug)
      .select()
      .single();

    return updateRes;
  }

  function applyImageToElement(el, record) {
    if (!el || !record) return;
    var url = record.image_url;
    if (url) {
      el.src = url;
      el.alt = record.title || el.alt || '';
    }
  }

  async function loadImagesIntoPage() {
    if (!getSupabase()) return;

    var slugs = document.querySelectorAll('[data-image-slug]');
    if (!slugs.length) return;

    var res = await getImagesByCategory(null);
    if (res.error || !res.data) return;

    var bySlug = {};
    res.data.forEach(function(row) {
      bySlug[row.slug] = row;
    });

    slugs.forEach(function(el) {
      var slug = el.getAttribute('data-image-slug');
      if (slug && bySlug[slug]) {
        applyImageToElement(el, bySlug[slug]);
      }
    });
  }

  function renderTeamCard(member) {
    var initials = initialsFromTitle(member.title);
    var photoHtml = member.image_url
      ? '<img src="' + escapeHtml(member.image_url) + '" alt="' + escapeHtml(member.title) + '" class="team-photo" loading="lazy">'
      : '<div class="team-avatar" aria-hidden="true">' + escapeHtml(initials) + '</div>';

    return (
      '<div class="team-card">' +
        photoHtml +
        '<h3>' + escapeHtml(member.title) + '</h3>' +
        '<p class="team-role">' + escapeHtml(member.subtitle || '') + '</p>' +
        '<p class="team-bio">' + escapeHtml(member.description || '') + '</p>' +
      '</div>'
    );
  }

  async function renderTeamSection(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var res = await getImagesByCategory('team');
    if (res.error) {
      console.warn('Team images:', res.error.message);
      return;
    }
    if (!res.data || !res.data.length) return;

    container.innerHTML = res.data.map(renderTeamCard).join('');
  }

  async function ensureSupabaseReady() {
    if (typeof window.waitForSupabase === 'function') {
      await window.waitForSupabase();
    } else if (typeof window.initializeSupabaseClient === 'function') {
      window.initializeSupabaseClient();
    }
  }

  window.siteImages = {
    BUCKET: BUCKET,
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
