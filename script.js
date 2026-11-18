const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (!reducedMotion.matches) {
  document.documentElement.classList.add('motion-ready');

  const loader = document.getElementById('loader');
  loader.hidden = false;
  window.setTimeout(() => {
    document.documentElement.classList.add('is-ready');
    loader.classList.add('is-leaving');
    window.setTimeout(() => { loader.hidden = true; }, 600);
  }, 2600);

  document.querySelectorAll('.section, .site-footer').forEach((section) => {
    section.querySelectorAll('.reveal').forEach((element, index) => {
      element.style.setProperty('--reveal-delay', Math.min(index, 4) * 65 + 'ms');
    });
  });
  const revealTargets = document.querySelectorAll(
    '.hero, .reveal, [data-network], [data-process], [data-rollout]'
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      }
    }, { threshold: 0.18 });
    revealTargets.forEach((target) => observer.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  }

  const heroNetwork = document.querySelector('.hero-network');
  let scheduled = false;
  const updateNetworkPosition = () => {
    scheduled = false;
    const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight)));
    heroNetwork.style.transform = 'translate3d(0, ' + Math.round(progress * 22) + 'px, 0)';
  };
  window.addEventListener('scroll', () => {
    if (scheduled || window.scrollY > window.innerHeight * 1.3) return;
    scheduled = true;
    window.requestAnimationFrame(updateNetworkPosition);
  }, { passive: true });

  const snapSections = [...document.querySelectorAll('.section, .site-footer')];
  const header = document.querySelector('.site-header');
  const desktopSnap = window.matchMedia('(min-width: 1101px) and (min-height: 821px)');
  let scrollLockEnabled = false;
  let gestureTotal = 0;
  let gestureConsumed = false;
  let gestureResetTimer;
  let scrollAnimation = null;

  const updateScrollLock = () => {
    const availableHeight = window.innerHeight - header.offsetHeight;
    scrollLockEnabled = desktopSnap.matches &&
      snapSections.every((section) => section.getBoundingClientRect().height <= availableHeight + 2);
    if (!scrollLockEnabled) cancelScrollAnimation();
  };

  const cancelScrollAnimation = (keepSnapDisabled = false) => {
    if (!scrollAnimation) return;
    window.cancelAnimationFrame(scrollAnimation.frame);
    scrollAnimation = null;
    if (!keepSnapDisabled) document.documentElement.classList.remove('is-programmatic-scroll');
  };

  const sectionTop = (index) => Math.max(0, snapSections[index].offsetTop - header.offsetHeight);
  const nearestSection = () => snapSections.reduce((best, _, index) =>
    Math.abs(sectionTop(index) - window.scrollY) <
    Math.abs(sectionTop(best) - window.scrollY) ? index : best, 0);

  const animateToSection = (originIndex, targetIndex) => {
    cancelScrollAnimation(true);
    const from = window.scrollY;
    const to = sectionTop(targetIndex);
    if (Math.abs(to - from) < 1) {
      document.documentElement.classList.remove('is-programmatic-scroll');
      return;
    }

    const duration = Math.max(420, Math.min(860,
      Math.abs(to - from) / Math.max(1, window.innerHeight - header.offsetHeight) * 860));
    const animation = { originIndex, targetIndex, direction: Math.sign(to - from), frame: 0 };
    scrollAnimation = animation;
    document.documentElement.classList.add('is-programmatic-scroll');

    let startedAt;
    const step = (now) => {
      if (scrollAnimation !== animation) return;
      if (startedAt === undefined) startedAt = now;
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = progress * progress * progress *
        (progress * (progress * 6 - 15) + 10);
      window.scrollTo(0, from + (to - from) * eased);
      if (progress < 1) {
        animation.frame = window.requestAnimationFrame(step);
      } else {
        scrollAnimation = null;
        document.documentElement.classList.remove('is-programmatic-scroll');
      }
    };
    animation.frame = window.requestAnimationFrame(step);
  };

  window.addEventListener('resize', updateScrollLock, { passive: true });
  document.addEventListener('click', (event) => {
    if (event.target.closest('a[href^="#"]')) cancelScrollAnimation();
  });
  window.addEventListener('keydown', cancelScrollAnimation);
  updateScrollLock();

  window.addEventListener('wheel', (event) => {
    if (!scrollLockEnabled || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    if (!document.documentElement.classList.contains('is-ready')) return;

    const delta = event.deltaMode === 1 ? event.deltaY * 16 :
      event.deltaMode === 2 ? event.deltaY * window.innerHeight : event.deltaY;
    window.clearTimeout(gestureResetTimer);
    gestureResetTimer = window.setTimeout(() => {
      gestureTotal = 0;
      gestureConsumed = false;
    }, 190);
    if (gestureConsumed) return;
    gestureTotal += delta;
    if (Math.abs(gestureTotal) < 35) return;

    const direction = Math.sign(gestureTotal);
    gestureTotal = 0;
    gestureConsumed = true;
    if (scrollAnimation) {
      if (direction !== scrollAnimation.direction) {
        animateToSection(scrollAnimation.targetIndex, scrollAnimation.originIndex);
      }
      return;
    }
    const currentIndex = nearestSection();
    const targetIndex = Math.max(0, Math.min(snapSections.length - 1, currentIndex + direction));
    if (targetIndex !== currentIndex) animateToSection(currentIndex, targetIndex);
  }, { passive: false });
}

const sensorStage = document.querySelector('[data-sensor-stage]');
if (sensorStage) {
  const sensorImage = document.querySelector('[data-sensor-image]');
  const sensorToggle = document.querySelector('[data-sensor-toggle]');
  const sensorToggleLabel = document.querySelector('[data-sensor-toggle-label]');
  const sensorState = document.querySelector('[data-sensor-state]');
  const sensorHint = document.querySelector('[data-sensor-hint]');
  const framePaths = Array.from({ length: 48 }, (_, index) =>
    `./assets/sensor/frame_${String(index).padStart(3, '0')}.webp`);
  let currentView = 0;
  let isOpen = false;
  let isAnimating = false;
  let ready = false;
  let loading = false;
  let lastPointerX = 0;
  let dragDistance = 0;

  const showFrame = (index) => { sensorImage.src = framePaths[index]; };
  const rotate = (steps) => {
    if (!ready || isOpen || isAnimating) return;
    currentView = (currentView + steps % 24 + 24) % 24;
    showFrame(currentView);
  };

  const preload = () => {
    if (loading) return;
    loading = true;
    Promise.all(framePaths.map((path) => new Promise((resolve, reject) => {
      const frame = new Image();
      frame.onload = resolve;
      frame.onerror = reject;
      frame.src = path;
    }))).then(() => {
      ready = true;
      sensorToggle.disabled = false;
      sensorHint.textContent = 'Trascina il modello per ruotarlo.';
    }).catch(() => {
      sensorHint.textContent = 'Anteprima interattiva non disponibile.';
    });
  };

  if ('IntersectionObserver' in window) {
    const preloadObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        preload();
        preloadObserver.disconnect();
      }
    }, { rootMargin: '650px' });
    preloadObserver.observe(sensorStage);
  } else {
    preload();
  }

  const playFrames = (frames, done) => {
    let start;
    let shown = -1;
    const tick = (now) => {
      if (start === undefined) start = now;
      const next = Math.min(frames.length - 1, Math.floor((now - start) / 42));
      if (next !== shown) {
        showFrame(frames[next]);
        shown = next;
      }
      if (next < frames.length - 1) {
        window.requestAnimationFrame(tick);
      } else {
        done();
      }
    };
    window.requestAnimationFrame(tick);
  };

  const updateOpenState = (open) => {
    isOpen = open;
    isAnimating = false;
    sensorStage.classList.toggle('is-open', open);
    sensorStage.classList.remove('is-animating');
    sensorToggle.disabled = false;
    sensorToggle.setAttribute('aria-expanded', String(open));
    sensorToggleLabel.textContent = open ? 'Chiudi l’involucro' : 'Apri l’involucro';
    sensorToggle.querySelector('[aria-hidden]').textContent = open ? '↙' : '↗';
    sensorState.textContent = open ? 'Scheda d’interfaccia' : 'Vista esterna · 360°';
    sensorHint.textContent = open ? 'Chiudi l’involucro per ruotare il modello.' : 'Trascina il modello per ruotarlo.';
    sensorImage.alt = open
      ? 'Involucro aperto con la scheda d’interfaccia WaterFlaw visibile'
      : 'Involucro del prototipo WaterFlaw, vista ruotabile a 360 gradi';
  };

  sensorToggle.addEventListener('click', () => {
    if (!ready || isAnimating) return;
    if (reducedMotion.matches) {
      showFrame(isOpen ? 23 : 47);
      currentView = 23;
      updateOpenState(!isOpen);
      return;
    }
    isAnimating = true;
    sensorStage.classList.add('is-animating');
    sensorToggle.disabled = true;
    if (isOpen) {
      playFrames(Array.from({ length: 24 }, (_, index) => 47 - index), () => {
        currentView = 23;
        showFrame(23);
        updateOpenState(false);
      });
      return;
    }
    const forward = (23 - currentView + 24) % 24;
    const backward = (currentView - 23 + 24) % 24;
    const direction = forward <= backward ? 1 : -1;
    const steps = Math.min(forward, backward);
    const alignment = Array.from({ length: steps }, (_, index) =>
      (currentView + (index + 1) * direction + 24 * 2) % 24);
    playFrames([...alignment, ...Array.from({ length: 24 }, (_, index) => index + 24)], () => {
      currentView = 23;
      updateOpenState(true);
    });
  });

  sensorStage.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    rotate(event.key === 'ArrowRight' ? 1 : -1);
  });
  sensorStage.addEventListener('pointerdown', (event) => {
    if (!ready || isOpen || isAnimating || (event.pointerType === 'mouse' && event.button !== 0)) return;
    sensorStage.setPointerCapture(event.pointerId);
    sensorStage.classList.add('is-dragging');
    lastPointerX = event.clientX;
    dragDistance = 0;
  });
  sensorStage.addEventListener('pointermove', (event) => {
    if (!sensorStage.hasPointerCapture(event.pointerId)) return;
    dragDistance += event.clientX - lastPointerX;
    lastPointerX = event.clientX;
    const steps = Math.trunc(dragDistance / 14);
    if (steps) {
      rotate(steps);
      dragDistance -= steps * 14;
    }
  });
  const endDrag = (event) => {
    if (sensorStage.hasPointerCapture(event.pointerId)) sensorStage.releasePointerCapture(event.pointerId);
    sensorStage.classList.remove('is-dragging');
  };
  sensorStage.addEventListener('pointerup', endDrag);
  sensorStage.addEventListener('pointercancel', endDrag);
}
