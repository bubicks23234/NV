import { createSignal } from 'solid-js';
import { UiIcon } from './UiIcon';
import { copyToClipboard } from '../utils/clipboard';

export function ContactCopyRow(props) {
  const [copied, setCopied] = createSignal(false);
  let resetTimer;

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const ok = await copyToClipboard(props.copyText);
    if (!ok) return;

    setCopied(true);
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => setCopied(false), 2000);
  };

  const mainClass = () =>
    `contact-copy-row__main ${props.wide ? 'contact-copy-row__main--wide' : ''}`;

  return (
    <div class={`contact-copy-row ${copied() ? 'contact-copy-row--copied' : ''}`}>
      {props.href ? (
        <a href={props.href} class={mainClass()}>
          {props.icon}
          <span class="contact-copy-row__label">{props.label}</span>
        </a>
      ) : (
        <div class={mainClass()}>
          {props.icon}
          <span class="contact-copy-row__label">{props.label}</span>
        </div>
      )}
      <button
        type="button"
        class="contact-copy-row__btn"
        aria-label={copied() ? 'Скопировано' : props.copyLabel ?? 'Копировать'}
        title={copied() ? 'Скопировано' : 'Копировать'}
        onClick={handleCopy}
      >
        <UiIcon name={copied() ? 'check' : 'copy'} class="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
