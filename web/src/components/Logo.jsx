const SOURCES = {
  header: '/images/logo-header.png',
  menu: '/images/logo-header.png',
};

export function Logo(props) {
  const variant = () => props.variant ?? 'header';

  return (
    <img
      src={SOURCES[variant()] ?? SOURCES.header}
      alt="ООО «Новые технологии» — проектирование и инжиниринг"
      class={`logo-img logo-img--${variant()}`}
      width={variant() === 'menu' ? 100 : 138}
      height={variant() === 'menu' ? 34 : 44}
      loading="eager"
      decoding="async"
    />
  );
}
