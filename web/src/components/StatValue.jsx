import { onMount, onCleanup } from 'solid-js';
import { prefersReducedMotion } from '../utils/motion';

function parseStat(value) {
  const match = String(value).match(/^(\d+)(\+|%)$/);
  if (!match) return null;
  return { target: Number(match[1]), suffix: match[2] };
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

export function StatValue(props) {
  let node;

  onMount(() => {
    const parsed = parseStat(props.value);
    if (!node) return;

    if (!parsed || prefersReducedMotion()) {
      node.textContent = props.value;
      return;
    }

    node.textContent = `0${parsed.suffix}`;
    const delay = props.delay ?? 0;
    const duration = props.duration ?? (parsed.target >= 50 ? 2000 : 1600);
    let rafId = 0;
    let timeoutId = 0;

    const animate = () => {
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const current = Math.round(parsed.target * easeOutCubic(progress));
        node.textContent = `${current}${parsed.suffix}`;
        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          node.textContent = props.value;
        }
      };
      rafId = requestAnimationFrame(step);
    };

    const target = node.closest('.stat-card') ?? node;
    const isMobile = window.matchMedia('(max-width: 639px)').matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timeoutId = window.setTimeout(animate, delay);
          observer.disconnect();
        }
      },
      {
        threshold: isMobile ? 0.15 : 0.35,
        rootMargin: isMobile ? '0px 0px -16px 0px' : '0px 0px -48px 0px',
      }
    );

    observer.observe(target);

    onCleanup(() => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
    });
  });

  return (
    <p ref={node} class="stat-card__value tabular-nums">
      {props.value}
    </p>
  );
}
