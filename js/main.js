const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    const service = link.dataset.service;
    const select = document.querySelector('#service');
    if (select) select.value = service;
  });
});

const quoteForm = document.querySelector('#quoteForm');
quoteForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(quoteForm);
  const message = [
    'Hello VICSpark Electrical Works,',
    '',
    'I would like to request a service/quote.',
    `Name: ${data.get('name')}`,
    `Phone: ${data.get('phone')}`,
    `Service: ${data.get('service')}`,
    `Details: ${data.get('details')}`
  ].join('\n');

  window.open(`https://wa.me/254791495748?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});

const year = document.querySelector('#year');

if (year) {
    year.textContent = new Date().getFullYear();
}