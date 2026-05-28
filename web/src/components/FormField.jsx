import { createSignal, Show } from 'solid-js';

export function FormField(props) {
  const [focused, setFocused] = createSignal(false);
  const getValue = () => {
    const v = props.value;
    return typeof v === 'function' ? v() : (v ?? '');
  };
  const hasValue = () => getValue().length > 0;
  const floated = () => focused() || hasValue();

  const baseClass =
    'peer w-full rounded-2xl border-2 bg-slate-50/80 px-4 pt-6 pb-2.5 text-base text-slate-800 outline-none placeholder-transparent transition-[border-color,box-shadow,background-color,transform] duration-300 ease-out';

  const stateClass = () =>
    focused()
      ? 'border-primary bg-white shadow-[0_0_0_4px_rgba(0,118,122,0.12)] -translate-y-px'
      : 'border-slate-200 hover:border-primary/25 hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(0,118,122,0.15)]';

  return (
    <div class="relative">
      <Show when={props.multiline}>
        <textarea
          id={props.id}
          name={props.name}
          rows={props.rows ?? 4}
          required={props.required}
          autocomplete={props.autocomplete}
          class={`${baseClass} ${stateClass()} resize-none min-h-[120px]`}
          placeholder={props.label}
          value={getValue()}
          onInput={(e) => props.onInput?.(e.currentTarget.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </Show>
      <Show when={!props.multiline}>
        <input
          id={props.id}
          name={props.name}
          type={props.type ?? 'text'}
          required={props.required}
          inputmode={props.inputmode}
          autocomplete={props.autocomplete}
          class={`${baseClass} ${stateClass()} h-[3.25rem] sm:h-14`}
          placeholder={props.label}
          value={getValue()}
          onInput={(e) => props.onInput?.(e.currentTarget.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </Show>
      <label
        for={props.id}
        class={`pointer-events-none absolute left-4 transition-all duration-200 ${
          floated()
            ? 'top-2 text-[11px] font-semibold text-primary'
            : 'top-1/2 -translate-y-1/2 text-base text-slate-400'
        } ${props.multiline && floated() ? 'top-3' : ''} ${props.multiline && !floated() ? 'top-6 translate-y-0' : ''}`}
      >
        {props.label}
      </label>
    </div>
  );
}
