import { reveal } from '../directives/reveal';

export function SectionHeader(props) {
  const align = () => props.align ?? 'center';
  const alignClass = () =>
    align() === 'left' ? 'text-left max-w-2xl' : 'text-center max-w-2xl mx-auto';

  const revealArg = () => {
    if (props.reveal === false) return undefined;
    return props.revealDelay != null ? { delay: props.revealDelay } : {};
  };

  return (
    <div
      use:reveal={
        props.reveal === false
          ? undefined
          : { ...revealArg(), variant: props.revealVariant ?? 'up' }
      }
      class={`section-header ${alignClass()} ${props.reveal !== false ? 'section-header--animate' : ''}`}
    >
      {props.eyebrow && <p class="eyebrow">{props.eyebrow}</p>}
      <h2 class="heading-lg">{props.title}</h2>
      {props.description && <p class="section-header__desc">{props.description}</p>}
    </div>
  );
}
