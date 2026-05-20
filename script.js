// Hover functionality for service cards
document.addEventListener('DOMContentLoaded', function() {
  const serviceCards = document.querySelectorAll('.service-card');
  
  serviceCards.forEach(card => {
    const hoverImage = card.querySelector('.hover-image');
    
    if (hoverImage) {
      card.addEventListener('mouseenter', function() {
        hoverImage.style.opacity = '1';
      });
      
      card.addEventListener('mouseleave', function() {
        hoverImage.style.opacity = '0';
      });
    }
  });
});

