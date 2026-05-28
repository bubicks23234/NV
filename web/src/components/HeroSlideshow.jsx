import { createSignal, onMount, onCleanup, For, createEffect } from 'solid-js';
import { HERO_SLIDES, HERO_SLIDE_MS } from '../data/heroSlides';
import { prefersReducedMotion } from '../utils/motion';

const LEAVE_MS = 2400;

export function HeroSlideshow() {
  const [active, setActive] = createSignal(0);
  const [leaving, setLeaving] = createSignal(null);
  const [paused, setPaused] = createSignal(false);

  const goTo = (index) => {
    const next = ((index % HERO_SLIDES.length) + HERO_SLIDES.length) % HERO_SLIDES.length;
    if (next === active()) return;

    const prev = active();
    setLeaving(prev);
    setActive(next);

    setTimeout(() => {
      setLeaving((current) => (current === prev ? null : current));
    }, LEAVE_MS);
  };

  const next = () => goTo(active() + 1);

  onMount(() => {
    HERO_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.src;
    });
  });

  createEffect(() => {
    if (prefersReducedMotion()) return;

    paused();

    const timer = setInterval(() => {
      if (!paused() && !document.hidden) next();
    }, HERO_SLIDE_MS);

    onCleanup(() => clearInterval(timer));
  });

  const slideClass = (i) => {
    if (i === active()) return 'hero-slide hero-slide--active';
    if (i === leaving()) return 'hero-slide hero-slide--leave';
    return 'hero-slide';
  };

  return (
    <div
      class="hero-slideshow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <For each={HERO_SLIDES}>
        {(slide, i) => (
          <div class={slideClass(i())} aria-hidden={i() !== active() && i() !== leaving()}>
            <div
              class="hero-slide__inner"
              style={{ 'background-image': `url('${slide.src}')` }}
              role="img"
              aria-label={slide.alt}
            />
          </div>
        )}
      </For>

      <div class="hero-slideshow__dots" role="tablist" aria-label="Слайды главной страницы">
        <For each={HERO_SLIDES}>
          {(slide, i) => (
            <button
              type="button"
              role="tab"
              class={`hero-slideshow__dot ${i() === active() ? 'hero-slideshow__dot--active' : ''}`}
              aria-selected={i() === active()}
              aria-label={slide.alt}
              onClick={() => goTo(i())}
            >
              {i() === active() && (
                <span
                  class="hero-slideshow__dot-fill"
                  style={{ 'animation-duration': `${HERO_SLIDE_MS}ms` }}
                />
              )}
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
