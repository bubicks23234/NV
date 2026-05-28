import { For } from 'solid-js';
import { reveal } from '../directives/reveal';
import { UiIcon } from './UiIcon';

export function Gallery(props) {
  return (
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
  );
}
