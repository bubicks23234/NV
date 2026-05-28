/** Иконки Lucide (MIT) — единый стиль */
function Svg(props) {
  return (
    <svg
      class={props.class ?? 'w-5 h-5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden={props.label ? undefined : true}
      aria-label={props.label}
    >
      {props.children}
    </svg>
  );
}

export function UiIcon(props) {
  const c = () => props.class ?? 'w-5 h-5';
  const n = () => props.name;

  return (
    <>
      {n() === 'x' && (
        <Svg class={c()} label={props.label}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </Svg>
      )}
      {n() === 'chevronLeft' && (
        <Svg class={c()} label={props.label}>
          <path d="m15 18-6-6 6-6" />
        </Svg>
      )}
      {n() === 'chevronRight' && (
        <Svg class={c()} label={props.label}>
          <path d="m9 18 6-6-6-6" />
        </Svg>
      )}
      {n() === 'phone' && (
        <Svg class={c()} label={props.label}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </Svg>
      )}
      {n() === 'mail' && (
        <Svg class={c()} label={props.label}>
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </Svg>
      )}
      {n() === 'mapPin' && (
        <Svg class={c()} label={props.label}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </Svg>
      )}
      {n() === 'zoomIn' && (
        <Svg class={c()} label={props.label}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
          <path d="M11 8v6" />
          <path d="M8 11h6" />
        </Svg>
      )}
      {n() === 'check' && (
        <Svg class={c()} label={props.label}>
          <path d="M20 6 9 17l-5-5" />
        </Svg>
      )}
      {n() === 'copy' && (
        <Svg class={c()} label={props.label}>
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </Svg>
      )}
      {n() === 'externalLink' && (
        <Svg class={c()} label={props.label}>
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </Svg>
      )}
      {n() === 'arrowDown' && (
        <Svg class={c()} label={props.label}>
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </Svg>
      )}
      {n() === 'building' && (
        <Svg class={c()} label={props.label}>
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          <path d="M10 6h4" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
          <path d="M10 18h4" />
        </Svg>
      )}
      {n() === 'clipboard' && (
        <Svg class={c()} label={props.label}>
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M12 11h4" />
          <path d="M12 16h4" />
          <path d="M8 11h.01" />
          <path d="M8 16h.01" />
        </Svg>
      )}
      {n() === 'trees' && (
        <Svg class={c()} label={props.label}>
          <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" />
          <path d="M7 16v6" />
          <path d="M13 19v3" />
          <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5" />
        </Svg>
      )}
    </>
  );
}
