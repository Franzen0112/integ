/**
 * Admin: upload site images (auto-save to Storage + database)
 */
(function() {
  'use strict';

  var CATEGORY_LABELS = {
    team: 'Our Team',
    product: 'Products / Offers',
    service: 'Services',
    studio: 'Studio'
  };

  function statusEl(card, text, type) {
    var el = card.querySelector('.admin-img-status');
    if (!el) return;
    el.textContent = text;
    el.className = 'admin-img-status admin-img-status--' + (type || 'idle');
  }

  function previewHtml(record) {
    var url = window.siteImages.resolveImageUrl(record);
    if (url) {
      return '<img src="' + window.siteImages.escapeHtml(url) + '" alt="" class="admin-img-preview" onerror="this.outerHTML=\'<div class=admin-img-placeholder>' +
        window.siteImages.escapeHtml(window.siteImages.initialsFromTitle(record.title)) + '</div>\'">';
    }
    var initials = window.siteImages.initialsFromTitle(record.title);
    return '<div class="admin-img-placeholder">' + window.siteImages.escapeHtml(initials) + '</div>';
  }

  function buildCard(record) {
    var catLabel = CATEGORY_LABELS[record.category] || record.category;
    var card = document.createElement('div');
    card.className = 'admin-img-card';
    card.dataset.slug = record.slug;
    card.innerHTML =
      '<div class="admin-img-preview-wrap">' + previewHtml(record) + '</div>' +
      '<div class="admin-img-meta">' +
        '<span class="admin-img-cat">' + window.siteImages.escapeHtml(catLabel) + '</span>' +
        '<strong>' + window.siteImages.escapeHtml(record.title) + '</strong>' +
        (record.subtitle ? '<span class="admin-img-sub">' + window.siteImages.escapeHtml(record.subtitle) + '</span>' : '') +
        '<code class="admin-img-slug">' + window.siteImages.escapeHtml(record.slug) + '</code>' +
      '</div>' +
      '<label class="admin-img-upload-btn">' +
        '<i class="fa-solid fa-cloud-arrow-up"></i> Change photo' +
        '<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden>' +
      '</label>' +
      '<span class="admin-img-status admin-img-status--idle"></span>';

    var input = card.querySelector('input[type="file"]');
    input.addEventListener('change', function() {
      onFileSelected(card, record.slug, input.files[0]);
      input.value = '';
    });

    return card;
  }

  async function onFileSelected(card, slug, file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      statusEl(card, 'Max 5MB', 'error');
      return;
    }

    statusEl(card, 'Saving…', 'saving');

    var res = await window.siteImages.uploadAndSaveImage(slug, file);
    if (res.error) {
      statusEl(card, res.error.message || 'Upload failed', 'error');
      alert('Upload failed:\n' + (res.error.message || 'Check you are logged in as admin and ran images-schema-vercel.sql'));
      return;
    }

    var wrap = card.querySelector('.admin-img-preview-wrap');
    if (wrap) {
      wrap.innerHTML = previewHtml(res.data);
    }
    statusEl(card, 'Saved ✓', 'ok');
    setTimeout(function() {
      statusEl(card, '', 'idle');
    }, 2500);
  }

  async function initAdminImagesPanel() {
    var grid = document.getElementById('adminImagesGrid');
    if (!grid || !window.siteImages) return;

    grid.innerHTML = '<p class="admin-img-loading">Loading image slots…</p>';

    await window.siteImages.ensureSupabaseReady();

    var res = await window.siteImages.getAllImagesAdmin();
    var list = (res.data && res.data.length) ? res.data : window.siteImages.FALLBACK_CATALOG;

    grid.innerHTML = '';
    if (res.error) {
      var note = document.createElement('p');
      note.className = 'admin-img-error';
      note.style.gridColumn = '1 / -1';
      note.innerHTML = 'Database optional — showing local <strong>images/</strong> folder. Run <strong>images-schema-vercel.sql</strong> for cloud upload. ' +
        (res.error.message ? '(' + window.siteImages.escapeHtml(res.error.message) + ')' : '');
      grid.appendChild(note);
    }

    list.forEach(function(record) {
      grid.appendChild(buildCard(record));
    });
  }

  window.adminImages = {
    init: initAdminImagesPanel
  };
})();
