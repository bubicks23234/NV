import { UiIcon } from './UiIcon';

const NAMES = {
  architecture: 'building',
  engineering: 'clipboard',
  landscaping: 'trees',
};

/** Иконки услуг — Lucide */
export function ServiceIcon(props) {
  const className = () => props.class ?? 'w-7 h-7';
  const icon = () => NAMES[props.name] ?? 'building';

  return <UiIcon name={icon()} class={className()} />;
}
