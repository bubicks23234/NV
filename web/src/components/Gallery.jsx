import { For, Show } from 'solid-js';
import { reveal } from '../directives/reveal';
import { UiIcon } from './UiIcon';

export function Gallery(props) {
  const featuredIndex = () => props.featuredIndex ?? props.items.length;

  return (
    <div class="gallery-layout">
      <div class="gallery-mosaic">
        <For each={props.items}>
          {(item, i) => (
            <button
              type="button"
              use:reveal={{ variant: 'scale', delay: (i() % 8) * 55 }}
              class="gallery-tile group"
              onClick={() => props.onOpen(i())}
            >
              <img src={item.src} alt={item.title} loading="lazy" class="gallery-tile__img" />
              <div class="gallery-tile__shade" />
              <div class="gallery-tile__info">
                <span class="gallery-tile__tag">{item.tag}</span>
                <span class="gallery-tile__title">{item.title}</span>
              </div>
              <span class="gallery-tile__icon" aria-hidden="true">
                <UiIcon name="zoomIn" class="w-4 h-4" />
              </span>
            </button>
          )}
        </For>
      </div>

      <Show when={props.featured}>
        <aside use:reveal={{ variant: 'left', delay: 120 }} class="gallery-feature">
          <p class="gallery-feature__eyebrow">Отдельный проект</p>
          <button
            type="button"
            class="gallery-feature__media group"
            aria-label={`Открыть: ${props.featured.title}`}
            onClick={() => props.onOpen(featuredIndex())}
          >
            <img src={props.featured.src} alt={props.featured.title} loading="lazy" class="gallery-feature__img" />
            <span class="gallery-feature__zoom" aria-hidden="true">
              <UiIcon name="zoomIn" class="w-4 h-4" />
            </span>
          </button>
          <div class="gallery-feature__body">
            <span class="gallery-feature__tag">{props.featured.tag}</span>
            <h3 class="gallery-feature__title">{props.featured.title}</h3>
            <p class="gallery-feature__text">{props.featured.description}</p>
          </div>
        </aside>
      </Show>
    </div>
  );
}
