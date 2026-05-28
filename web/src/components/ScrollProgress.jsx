/** Тонкая полоска прогресса прокрутки над шапкой */
export function ScrollProgress(props) {
  return (
    <div
      class={`scroll-progress ${props.hidden ? 'scroll-progress--hidden' : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(props.progress)}
      aria-label="Прогресс прокрутки страницы"
      style={{ transform: `scaleX(${props.progress / 100})` }}
    />
  );
}
