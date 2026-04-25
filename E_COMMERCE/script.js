const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
const authModal = document.querySelector('.auth-modal');
const authTitle = document.getElementById('auth-title');
const authButtons = document.querySelectorAll('[data-open-auth]');
const closeButtons = document.querySelectorAll('[data-close-auth]');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('open');
  });
}

const openAuth = (mode) => {
  if (!authModal || !authTitle) return;
  authTitle.textContent = mode === 'login' ? 'Welcome back' : 'Create your account';
  authModal.hidden = false;
  document.body.style.overflow = 'hidden';
};

const closeAuth = () => {
  if (!authModal) return;
  authModal.hidden = true;
  document.body.style.overflow = '';
};

authButtons.forEach((button) => {
  button.addEventListener('click', () => openAuth(button.dataset.openAuth));
});

closeButtons.forEach((button) => {
  button.addEventListener('click', closeAuth);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeAuth();
  }
});
