import { createSignal, createMemo } from 'solid-js';
import { formatPhoneMask, normalizePhoneDigits, splitPhoneMask } from '../utils/phoneMask';

const isDigitKey = (key) => /^\d$/.test(key);

export function PhoneField(props) {
  const [focused, setFocused] = createSignal(false);
  let inputRef;

  const digits = createMemo(() => {
    const v = props.value;
    return normalizePhoneDigits(typeof v === 'function' ? v() : v);
  });

  const display = createMemo(() => formatPhoneMask(digits()));
  const showPlaceholder = () => !focused() && digits().length === 0;

  const applyDigits = (nextDigits, el = inputRef) => {
    const normalized = normalizePhoneDigits(nextDigits);
    props.onInput?.(normalized);
    if (el) {
      forceDisplay(el, normalized);
    }
  };

  const forceDisplay = (el, d = digits()) => {
    const formatted = formatPhoneMask(d);
    el.value = !focused() && d.length === 0 ? '' : formatted;
    syncCaret(el, d);
  };

  const syncCaret = (el, d = digits()) => {
    requestAnimationFrame(() => {
      if (!el || document.activeElement !== el) return;
      const pos = splitPhoneMask(d).filled.length;
      try {
        el.setSelectionRange(pos, pos);
      } catch {
        /* iOS */
      }
    });
  };

  const handleBeforeInput = (e) => {
    if (e.inputType === 'insertText' && e.data && !/^\d$/.test(e.data)) {
      e.preventDefault();
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Tab' || e.key === 'Escape' || e.key.startsWith('Arrow')) return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      if (digits().length > 0) {
        applyDigits(digits().slice(0, -1), e.currentTarget);
      }
      return;
    }

    if (e.key.length === 1 && !isDigitKey(e.key)) {
      e.preventDefault();
      return;
    }

    if (isDigitKey(e.key) && digits().length >= 10) {
      e.preventDefault();
    }
  };

  const handleInput = (e) => {
    const el = e.currentTarget;
    const next = normalizePhoneDigits(el.value);
    if (next !== digits()) {
      props.onInput?.(next);
    }
    forceDisplay(el, next);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = normalizePhoneDigits(e.clipboardData?.getData('text') ?? '');
    if (!pasted) return;
    const combined = normalizePhoneDigits(digits() + pasted);
    applyDigits(combined, e.currentTarget);
  };

  const handleCompositionEnd = (e) => {
    e.preventDefault();
    const next = normalizePhoneDigits(e.currentTarget.value);
    applyDigits(next, e.currentTarget);
  };

  const handleFocus = (e) => {
    setFocused(true);
    forceDisplay(e.currentTarget);
  };

  const handleBlur = (e) => {
    setFocused(false);
    forceDisplay(e.currentTarget);
  };

  return (
    <div class="relative">
      <label for={props.id} class="phone-field-label">
        Телефон
      </label>
      <div
        class={`phone-field-box ${focused() ? 'phone-field-box--focus' : ''}`}
        onClick={() => inputRef?.focus()}
      >
        <input
          ref={inputRef}
          id={props.id}
          name={props.name}
          type="tel"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="tel"
          required={props.required}
          class="phone-field-input"
          value={showPlaceholder() ? '' : display()}
          placeholder="+7 (___) ___-__-__"
          onBeforeInput={handleBeforeInput}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionEnd={handleCompositionEnd}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={(e) => syncCaret(e.currentTarget)}
        />
      </div>
    </div>
  );
}
