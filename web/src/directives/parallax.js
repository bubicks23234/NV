import { onMount } from 'solid-js';
import { prefersReducedMotion } from '../utils/motion';

/** Лёгкий параллакс относительно центра экрана */
export function parallax(el, accessor) {
  onMount(() => {
    if (prefersReducedMotion()) return;

    const getSpeed = () => {
      const value = typeof accessor === 'function' ? accessor() : accessor;
      return value?.speed ?? 0.1;
    };

    let ticking = false;

    const update = () => {
      ticking = false;
      const rect = el.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${centerOffset * getSpeed()}px, 0)`;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  });
}

/** Параллакс фона hero при скролле */
export function heroParallax(bgEl) {
  onMount(() => {
    if (prefersReducedMotion()) return;

    const section = bgEl.closest('.hero-section');
    if (!section) return;

    const layer = bgEl.querySelector('.hero-section__bg-parallax');
    const mesh = bgEl.querySelector('.hero-section__mesh');
    const pattern = bgEl.querySelector('.hero-section__pattern');
    const orbsWrap = bgEl.querySelector('.hero-section__orbs');

    let ticking = false;

    const update = () => {
      ticking = false;
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight * 1.5) return;

      const scrollIn = Math.max(0, -rect.top);

      if (layer) {
        layer.style.transform = `translate3d(0, ${scrollIn * 0.42}px, 0)`;
      }
      if (mesh) {
        mesh.style.transform = `translate3d(0, ${scrollIn * 0.14}px, 0)`;
      }
      if (pattern) {
        pattern.style.transform = `translate3d(0, ${scrollIn * 0.08}px, 0)`;
      }
      /* Orbs: only layer parallax — CSS drift stays on children */
      if (orbsWrap) {
        orbsWrap.style.transform = `translate3d(0, ${scrollIn * 0.1}px, 0)`;
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    return () => window.removeEventListener('scroll', onScroll);
  });
}
