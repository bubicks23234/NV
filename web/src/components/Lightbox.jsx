import { createEffect, onMount, onCleanup, Show, For } from 'solid-js';
import { Transition } from 'solid-transition-group';
import { UiIcon } from './UiIcon';

export function Lightbox(props) {
  let touchStartX = 0;
  let touchStartY = 0;
  let thumbsEl;

  const index = () => props.index();
  const item = () => props.items()[index()];
  const total = () => props.items().length;

  const go = (delta) => {
    const next = (index() + delta + total()) % total();
    props.onChange(next);
  };

  const onKey = (e) => {
    if (!props.open()) return;
    if (e.key === 'Escape') props.onClose();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  };

  createEffect(() => {
    if (props.open()) {
      document.body.classList.add('lightbox-open');
    } else {
      document.body.classList.remove('lightbox-open');
    }
  });

  createEffect(() => {
    if (!props.open()) return;
    const i = index();
    requestAnimationFrame(() => {
      const active = thumbsEl?.querySelector(`[data-thumb="${i}"]`);
      active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  });

  onMount(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  onCleanup(() => document.body.classList.remove('lightbox-open'));

  const handleTouchStart = (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) go(1);
    else go(-1);
  };

  return (
    <Transition name="lightbox">
      <Show when={props.open()}>
        <div
          class="lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр изображения"
          onClick={(e) => e.target === e.currentTarget && props.onClose()}
        >
          <button
            type="button"
            class="lightbox-close-fab"
            aria-label="Закрыть просмотр"
            onClick={props.onClose}
          >
            <UiIcon name="x" class="w-6 h-6" />
          </button>

          <div class="lightbox-top">
            <div class="lightbox-top__text">
              <p class="text-sm font-semibold truncate">{item()?.title}</p>
              <p class="text-xs text-white/60">
                {index() + 1} / {total()}
              </p>
            </div>
            <button type="button" class="lightbox-btn" aria-label="Закрыть" onClick={props.onClose}>
              <UiIcon name="x" class="w-6 h-6" />
            </button>
          </div>

          <div
            class="lightbox-stage"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              type="button"
              class="lightbox-nav lightbox-nav--side hidden sm:flex"
              aria-label="Предыдущее"
              onClick={() => go(-1)}
            >
              <UiIcon name="chevronLeft" class="w-7 h-7" />
            </button>

            <img
              src={item()?.src}
              alt={item()?.title}
              class="lightbox-image"
              draggable={false}
            />

            <button
              type="button"
              class="lightbox-nav lightbox-nav--side hidden sm:flex"
              aria-label="Следующее"
              onClick={() => go(1)}
            >
              <UiIcon name="chevronRight" class="w-7 h-7" />
            </button>
          </div>

          <div class="lightbox-bottom">
            <div class="lightbox-bottom__nav sm:hidden">
              <button type="button" class="lightbox-btn" aria-label="Назад" onClick={() => go(-1)}>
                <UiIcon name="chevronLeft" class="w-6 h-6" />
              </button>
              <button type="button" class="lightbox-btn" aria-label="Вперёд" onClick={() => go(1)}>
                <UiIcon name="chevronRight" class="w-6 h-6" />
              </button>
            </div>

            <div class="lightbox-thumbs scrollbar-hide" ref={thumbsEl}>
              <For each={props.items()}>
                {(img, i) => (
                  <button
                    type="button"
                    data-thumb={i()}
                    class={`lightbox-thumb ${i() === index() ? 'lightbox-thumb--active' : ''}`}
                    onClick={() => props.onChange(i())}
                  >
                    <img src={img.src} alt="" loading="lazy" />
                  </button>
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </Transition>
  );
}
