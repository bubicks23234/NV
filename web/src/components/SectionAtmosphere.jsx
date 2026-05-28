import { parallax } from '../directives/parallax';
import { Show } from 'solid-js';

const STREET_IMAGES = {
  left: '/images/street3D.png',
  right: '/images/street3D2.png',
};

export function SectionAtmosphere(props) {
  const tone = () => props.tone ?? 'light';
  const side = () => props.streetSide;

  return (
    <div class={`section-atmosphere section-atmosphere--${tone()}`} aria-hidden="true">
      <Show when={side() === 'left' || side() === 'right'}>
        <div class={`section-street section-street--${side()} ${props.streetLower ? 'section-street--lower' : ''}`}>
          <div class="section-street__clip">
            <div use:parallax={{ speed: side() === 'left' ? 0.035 : -0.035 }} class="section-street__float">
              <img
                src={STREET_IMAGES[side()]}
                alt=""
                loading="lazy"
                decoding="async"
                class="section-street__img"
              />
            </div>
          </div>
        </div>
      </Show>

      <span use:parallax={{ speed: 0.07 }} class="section-blob section-blob--a" />
      <span use:parallax={{ speed: -0.05 }} class="section-blob section-blob--b" />
      <span use:parallax={{ speed: 0.04 }} class="section-blob section-blob--c" />
      <div class="section-atmosphere__grid" />
    </div>
  );
}
