import { parallax } from '../directives/parallax';
import { For } from 'solid-js';

const STREET_IMAGES = {
  left: '/images/street3D.png',
  right: '/images/street3D2.png',
};

function StreetDecor(props) {
  const side = () => props.side;
  const src = () => props.src ?? STREET_IMAGES[side()];

  return (
    <div
      class={`section-street section-street--${side()} ${props.lower ? 'section-street--lower' : ''} ${props.compact ? 'section-street--compact' : ''} ${props.scope === 'upper' ? 'section-street--scope-upper' : ''} ${props.scope === 'lower' ? 'section-street--scope-lower' : ''}`}
    >
      <div class="section-street__clip">
        <div use:parallax={{ speed: side() === 'left' ? 0.035 : -0.035 }} class="section-street__float">
          <img src={src()} alt="" loading="lazy" decoding="async" class="section-street__img" />
        </div>
      </div>
    </div>
  );
}

export function SectionAtmosphere(props) {
  const tone = () => props.tone ?? 'light';
  const side = () => props.streetSide;
  const streetSrc = () => props.streetSrc ?? STREET_IMAGES[side()];

  const streets = () => {
    if (props.streets?.length) return props.streets;
    if (side() === 'left' || side() === 'right') {
      return [
        {
          side: side(),
          src: streetSrc(),
          lower: props.streetLower,
          compact: props.streetCompact,
        },
      ];
    }
    return [];
  };

  return (
    <div class={`section-atmosphere section-atmosphere--${tone()}`} aria-hidden="true">
      <For each={streets()}>
        {(street) => (
          <StreetDecor
            side={street.side}
            src={street.src}
            lower={street.lower}
            compact={street.compact}
            scope={street.scope}
          />
        )}
      </For>

      <span use:parallax={{ speed: 0.07 }} class="section-blob section-blob--a" />
      <span use:parallax={{ speed: -0.05 }} class="section-blob section-blob--b" />
      <span use:parallax={{ speed: 0.04 }} class="section-blob section-blob--c" />
      <div class="section-atmosphere__grid" />
    </div>
  );
}
