import { onMount } from 'solid-js';
import { prefersReducedMotion } from '../utils/motion';

export function reveal(el, accessor) {
  onMount(() => {
    const options = typeof accessor === 'function' ? accessor() ?? {} : accessor ?? {};
    const variant = options.variant ?? 'up';
    const delay = options.delay ?? 0;
    const immediate =
      options.immediate ?? Boolean(el.closest('.hero-section, [data-reveal-immediate]'));

    el.classList.add('reveal', `reveal--${variant}`);
    if (delay) el.style.transitionDelay = `${delay}ms`;

    const show = () => el.classList.add('visible');

    if (prefersReducedMotion()) {
      show();
      return;
    }

    if (immediate) {
      requestAnimationFrame(() => requestAnimationFrame(show));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          observer.unobserve(el);
        }
      },
      { threshold: options.threshold ?? 0.1, rootMargin: options.rootMargin ?? '0px 0px -48px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  });
}
