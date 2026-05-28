import { createSignal, onMount, For } from 'solid-js';
import { prefersReducedMotion } from '../utils/motion';

const TITLE_LINES = [
  [
    { text: 'Создаём', i: 0 },
    { text: 'пространство', i: 1 },
  ],
  [
    { text: 'для', i: 2 },
    { text: 'комфортной', i: 3 },
    { text: 'жизни', i: 4 },
  ],
];

const LEAD_CHUNKS = [
  'Архитектура, инжиниринг и полный цикл проектных работ',
  'для жилых комплексов и общественных объектов.',
];

const TRUST = [
  { value: '10+', label: 'лет опыта' },
  { value: '50+', label: 'проектов' },
  { value: '100%', label: 'по ГОСТ' },
];

export function HeroContent(props) {
  const [ready, setReady] = createSignal(prefersReducedMotion());

  onMount(() => {
    if (prefersReducedMotion()) return;
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  });

  return (
    <div class={`hero-section__copy hero-copy ${ready() ? 'hero-copy--ready' : ''}`}>
      <h1 class="hero-section__title hero-title">
        <For each={TITLE_LINES}>
          {(line) => (
            <span class="hero-title__line">
              <For each={line}>
                {(word) => (
                  <span
                    class={`hero-title__word ${word.accent ? 'hero-title__word--accent' : ''}`}
                    style={{ '--word-i': word.i }}
                  >
                    {word.text}
                  </span>
                )}
              </For>
            </span>
          )}
        </For>
        <span class="hero-title__underline" aria-hidden="true" />
      </h1>

      <p class="hero-section__lead hero-lead">
        <For each={LEAD_CHUNKS}>
          {(chunk, i) => (
            <span class="hero-lead__chunk" style={{ '--chunk-i': i() }}>
              {chunk}
            </span>
          )}
        </For>
      </p>

      <div class="hero-section__actions">
        <a href="#contact" class="btn-hero-primary btn-shine" onClick={props.onNavigate}>
          Обсудить проект
        </a>
        <a href="#gallery" class="btn-hero-secondary" onClick={props.onNavigate}>
          Портфолио
        </a>
      </div>

      <div class="hero-trust">
        <For each={TRUST}>
          {(item, i) => (
            <div class="hero-trust__item" style={{ '--trust-i': i() }}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
