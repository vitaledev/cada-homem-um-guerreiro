const toggle = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
if (toggle && mobileNav) {
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.setAttribute('aria-label', expanded ? 'Abrir menu' : 'Fechar menu');
    mobileNav.hidden = expanded;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) {
      mobileNav.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
}

// Native links remain usable when JavaScript is disabled.
const mainImage = document.getElementById('product-main-image');
const galleryLinks = document.querySelectorAll('[data-gallery-image]');
if (mainImage) {
  galleryLinks.forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      mainImage.src = link.href;
      mainImage.alt = link.querySelector('img').alt;
      galleryLinks.forEach(item => item.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'true');
    });
  });
}
