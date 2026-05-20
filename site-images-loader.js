/** Runs after site-images.js — local images already applied; optional cloud upgrade */
(function() {
  function run() {
    if (!window.siteImages) return;
    window.siteImages.applyAllLocalImagesNow();
    window.siteImages.initPublicImagesOnPage().catch(function(e) {
      console.warn('JJRK images:', e);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
