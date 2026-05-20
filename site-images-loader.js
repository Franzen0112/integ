/** Include after supabase-config.js + site-images.js */
document.addEventListener('DOMContentLoaded', function() {
  if (window.siteImages && window.siteImages.initPublicImagesOnPage) {
    window.siteImages.initPublicImagesOnPage().catch(function(e) {
      console.warn('JJRK images:', e);
    });
  }
});
