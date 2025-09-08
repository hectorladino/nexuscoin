// Carousel accesible con autoplay, pausa en hover y swipe táctil
(function () {
  const $carousel = document.querySelector('[data-carousel="hero"]');
  if (!$carousel) return;

  const track = $carousel.querySelector('[data-carousel-track]');
  const slides = Array.from($carousel.querySelectorAll('.carousel__slide'));
  const btnPrev = $carousel.querySelector('[data-action="prev"]');
  const btnNext = $carousel.querySelector('[data-action="next"]');
  const dotsWrap = $carousel.querySelector('[data-carousel-dots]');

  let index = 0;
  let autoTimer = null;
  const intervalMs = 5000;

  // Crear dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel__dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Ir al slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  function updateUI() {
    const offset = -index * 100;
    track.style.transform = `translateX(${offset}%)`;
    dotsWrap.querySelectorAll('.carousel__dot').forEach((d, i) => {
      d.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    updateUI();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);

  // Autoplay
  function startAuto() { stopAuto(); autoTimer = setInterval(next, intervalMs); }
  function stopAuto() { if (autoTimer) clearInterval(autoTimer); autoTimer = null; }

  $carousel.addEventListener('mouseenter', stopAuto);
  $carousel.addEventListener('mouseleave', startAuto);

  // Teclado
  $carousel.setAttribute('tabindex', '0');
  $carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // Swipe
  let startX = 0, isTouch = false;
  track.addEventListener('touchstart', (e) => { isTouch = true; startX = e.touches[0].clientX; stopAuto(); }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (!isTouch) return;
    const delta = e.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 40) (delta < 0 ? next() : prev());
    isTouch = false; startAuto();
  }, { passive: true });

  // Iniciar
  updateUI();
  startAuto();
})();

