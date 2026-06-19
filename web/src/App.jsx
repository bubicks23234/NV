import { createSignal, onMount, For, Show } from 'solid-js';
import { reveal } from './directives/reveal';
import { heroParallax } from './directives/parallax';
import { SectionAtmosphere } from './components/SectionAtmosphere';
import { GALLERY, GALLERY_ALL, GALLERY_FEATURED } from './data/gallery';
import { FormField } from './components/FormField';
import { ContactCopyRow } from './components/ContactCopyRow';
import { PhoneField } from './components/PhoneField';
import { Gallery } from './components/Gallery';
import { Lightbox } from './components/Lightbox';
import { MobileMenu } from './components/MobileMenu';
import { SectionHeader } from './components/SectionHeader';
import { YandexMap } from './components/YandexMap';
import { ServiceIcon } from './components/ServiceIcon';
import { Logo } from './components/Logo';
import { UiIcon } from './components/UiIcon';
import { HeroContent } from './components/HeroContent';
import { HeroSlideshow } from './components/HeroSlideshow';
import { ScrollProgress } from './components/ScrollProgress';
import { StatValue } from './components/StatValue';
import { SITE } from './data/seo';
import { isPhoneComplete } from './utils/phoneMask';
import './index.css';

const NAV = [
  { href: '#about', label: 'О компании' },
  { href: '#services', label: 'Услуги' },
  { href: '#houses', label: 'Частные дома' },
  { href: '#gallery', label: 'Галерея' },
  { href: '#contact', label: 'Контакты' },
];

const SERVICES = [
  {
    num: '01',
    title: 'Архитектурное проектирование',
    text: 'Концепции зданий, фасады, планировочные решения и визуализация для жилых и общественных объектов.',
    icon: 'architecture',
  },
  {
    num: '02',
    title: 'Инжиниринг и рабочая документация',
    text: 'Полный цикл проектных работ: конструктив, инженерные сети, сметы и соответствие нормативам.',
    icon: 'engineering',
  },
  {
    num: '03',
    title: 'Благоустройство территорий',
    text: 'Дворовые пространства, озеленение, детские и спортивные площадки, парковки и инфраструктура.',
    icon: 'landscaping',
  },
];

const STATS = [
  { value: '10+', label: 'Лет на рынке' },
  { value: '50+', label: 'Реализованных проектов' },
  { value: '100%', label: 'Соответствие ГОСТ' },
  { value: '24/7', label: 'Поддержка объектов' },
];

export default function App() {
  const [menuOpen, setMenuOpen] = createSignal(false);
  const [scrolled, setScrolled] = createSignal(false);
  const [formSent, setFormSent] = createSignal(false);
  const [name, setName] = createSignal('');
  const [phone, setPhone] = createSignal('');
  const [message, setMessage] = createSignal('');
  const [lightboxOpen, setLightboxOpen] = createSignal(false);
  const [lightboxIndex, setLightboxIndex] = createSignal(0);
  const [scrollProgress, setScrollProgress] = createSignal(0);

  onMount(() => {
    const updateScroll = () => {
      const top = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(top > 16);
      setScrollProgress(max > 0 ? Math.min(100, (top / max) * 100) : 0);
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    updateScroll();
    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  });

  const closeMenu = () => setMenuOpen(false);
  const openLightbox = (i) => {
    setMenuOpen(false);
    setLightboxIndex(i);
    setLightboxOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isPhoneComplete(phone())) return;
    setFormSent(true);
  };

  return (
    <div class="min-h-screen font-sans">
      <Show when={!lightboxOpen()}>
        <div class="site-chrome">
          <ScrollProgress progress={scrollProgress()} hidden={menuOpen()} />

          <header class={`site-header ${scrolled() ? 'site-header--scrolled' : ''}`}>
        <div class="site-header__inner container-narrow">
          <a href="#" class="site-header__brand">
            <Logo variant="header" />
          </a>

          <nav class="site-header__nav hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-slate-600" aria-label="Основная навигация">
            <For each={NAV}>
              {(item) => (
                <a href={item.href} class="nav-link-desktop">
                  {item.label}
                </a>
              )}
            </For>
          </nav>

          <a href="#contact" class="hidden md:inline-flex btn-header-cta">
            Связаться
          </a>

          <button
            type="button"
            class={`burger md:hidden ${menuOpen() ? 'burger--open' : ''}`}
            aria-expanded={menuOpen()}
            aria-label={menuOpen() ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setMenuOpen(!menuOpen())}
          >
            <span class="burger__line" />
            <span class="burger__line" />
            <span class="burger__line" />
          </button>
        </div>
          </header>
        </div>
      </Show>

      <MobileMenu open={menuOpen} onClose={closeMenu} items={NAV} />

      <Lightbox
        open={lightboxOpen}
        index={lightboxIndex}
        items={() => GALLERY_ALL}
        onChange={setLightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />

      <main>
        <section class="hero-section">
          <div class="hero-section__bg" use:heroParallax>
            <div class="hero-section__bg-parallax">
              <HeroSlideshow />
            </div>
            <div class="hero-section__orbs" aria-hidden="true">
              <span class="hero-orb hero-orb--1" />
              <span class="hero-orb hero-orb--2" />
              <span class="hero-orb hero-orb--3" />
            </div>
            <div class="hero-section__pattern" aria-hidden="true" />
            <div class="hero-section__bg-overlay" />
            <div class="hero-section__mesh" aria-hidden="true" />
          </div>

          <div class="hero-section__grid container-narrow">
            <HeroContent onNavigate={closeMenu} />
          </div>
        </section>

        <section id="about" class="section section--white section--layered">
          <SectionAtmosphere tone="light" streetSide="left" streetLower />
          <div class="container-narrow section__inner">
            <div class="about-grid">
              <div use:reveal={{ variant: 'left' }} class="about-grid__text">
                <SectionHeader
                  reveal={false}
                  align="left"
                  eyebrow="О компании"
                  title="Инжиниринг нового поколения"
                  description="Команда проектировщиков и инженеров с полным циклом работ — от концепции до рабочей документации."
                />
                <p class="text-slate-600 leading-relaxed mt-6">
                  ООО «НОВЫЕ ТЕХНОЛОГИИ» воплощает смелые архитектурные решения. Современные жилые комплексы с
                  продуманной инфраструктурой, зонами отдыха и озеленением.
                </p>
              </div>

              <div class="about-grid__stats">
                <For each={STATS}>
                  {(stat, i) => (
                    <div
                      use:reveal={{ variant: 'scale', delay: i() * 90 }}
                      class="card-lift stat-card"
                    >
                      <StatValue value={stat.value} delay={i() * 90} />
                      <p class="stat-card__label">{stat.label}</p>
                    </div>
                  )}
                </For>
              </div>

              <button
                type="button"
                use:reveal={{ variant: 'right', delay: 120 }}
                class="about-grid__preview"
                onClick={() => openLightbox(0)}
              >
                <img src="/images/cam7.jpg" alt="Пример проекта" loading="lazy" />
                <span class="about-grid__preview-label">Смотреть проекты</span>
              </button>
            </div>
          </div>
        </section>

        <div class="section-group section-group--muted section-group--layered">
          <SectionAtmosphere
            tone="muted"
            streets={[
              { side: 'right', scope: 'upper' },
              { side: 'left', src: '/images/street3D3.png', lower: true, compact: true, scope: 'lower' },
            ]}
          />

          <section id="services" class="section section--in-group scroll-mt-20">
            <div class="container-narrow section__inner section__inner--group-top">
              <SectionHeader
                eyebrow="Услуги"
                title="Комплекс проектных решений"
                description="Проектирование зданий, архитектура и инжиниринговая экспертиза для девелоперов и застройщиков в Донецке."
              />

              <div class="services-list">
                <For each={SERVICES}>
                  {(service, i) => (
                    <article use:reveal={{ variant: 'left', delay: i() * 100 }} class="service-row">
                      <span class="service-row__num" data-num={service.num}>
                        {service.num}
                      </span>
                      <div class="service-row__icon">
                        <ServiceIcon name={service.icon} />
                      </div>
                      <div class="service-row__body">
                        <h3 class="service-row__title">{service.title}</h3>
                        <p class="service-row__text">{service.text}</p>
                      </div>
                    </article>
                  )}
                </For>
              </div>
            </div>
          </section>

          <section id="houses" class="section section--in-group scroll-mt-20">
            <div class="container-narrow section__inner section__inner--group-bottom">
              <div class="houses-grid">
                <div use:reveal={{ variant: 'left' }} class="houses-grid__text">
                  <SectionHeader
                    reveal={false}
                    align="left"
                    eyebrow="Частное строительство"
                    title="Проектирование индивидуальных жилых домов"
                    description="Архитектурные решения для частных заказчиков — от эскиза до рабочей документации с учётом участка, бюджета и ваших пожеланий."
                  />
                  <p class="text-slate-600 leading-relaxed mt-6">
                    Проектируем дома любой сложности: коттеджи, таунхаусы, загородные резиденции. Планировки,
                    фасады, инженерные системы и согласование документации — всё в одном месте.
                  </p>
                  <a href="#contact" class="houses-grid__cta">
                    Обсудить проект дома
                  </a>
                </div>

                <div use:reveal={{ variant: 'right', delay: 100 }} class="houses-grid__visual">
                  <img src="/images/house.jpg" alt="Индивидуальный жилой дом — пример проекта" loading="lazy" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <section id="gallery" class="section section--white section--layered scroll-mt-20 gallery-section">
          <SectionAtmosphere tone="light" />
          <div class="container-narrow gallery-section__inner">
            <div class="gallery-section__head">
              <div>
                <p class="eyebrow">Портфолио</p>
                <h2 class="heading-lg gallery-section__title">Галерея проектов</h2>
              </div>
              <p class="gallery-section__meta">
                {GALLERY_ALL.length} объектов · нажмите для просмотра
              </p>
            </div>
            <Gallery
              items={GALLERY}
              featured={GALLERY_FEATURED}
              featuredIndex={GALLERY.length}
              onOpen={openLightbox}
            />
          </div>
        </section>

        <section id="contact" class="section section--muted section--layered scroll-mt-20">
          <SectionAtmosphere tone="muted" />
          <div class="container-narrow section__inner">
            <SectionHeader
              eyebrow="Контакты"
              title="Свяжитесь с нами"
              description="Оставьте заявку — перезвоним и обсудим ваш проект."
            />

            <div class="contact-layout">
              <div use:reveal={{ variant: 'left', delay: 80 }} class="contact-info-card">
                <div class="contact-chips">
                  <ContactCopyRow
                    href="tel:+79494096881"
                    copyText="+79494096881"
                    copyLabel="Копировать номер телефона"
                    label="+7 (949) 409-68-81"
                    icon={<UiIcon name="phone" class="w-5 h-5 shrink-0" />}
                  />
                  <ContactCopyRow
                    href="tel:+79298139437"
                    copyText="+79298139437"
                    copyLabel="Копировать номер телефона"
                    label="+7 (929) 813-94-37"
                    icon={<UiIcon name="phone" class="w-5 h-5 shrink-0" />}
                  />
                  <ContactCopyRow
                    href="mailto:nt.dnr@yandex.ru"
                    copyText="nt.dnr@yandex.ru"
                    copyLabel="Копировать email"
                    label="nt.dnr@yandex.ru"
                    wide
                    icon={<UiIcon name="mail" class="w-5 h-5 shrink-0" />}
                  />
                  <ContactCopyRow
                    copyText="283003, ДНР, г. Донецк, пр-кт Дзержинского, д. 69Б, оф. 31"
                    copyLabel="Копировать адрес"
                    label="283003, ДНР, г. Донецк, пр-кт Дзержинского, д. 69Б, оф. 31"
                    wide
                    icon={<UiIcon name="mapPin" class="w-5 h-5 shrink-0" />}
                  />
                </div>

                <YandexMap />
              </div>

              <div use:reveal={{ variant: 'right', delay: 120 }} class="contact-form-card">
                <p class="contact-form-card__title">Заявка на проект</p>
                <Show
                  when={!formSent()}
                  fallback={
                    <div class="py-12 text-center">
                      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <UiIcon name="check" class="w-8 h-8" />
                      </div>
                      <p class="text-xl font-bold text-primary mb-2">Заявка принята</p>
                      <p class="text-slate-600 text-sm">Мы свяжемся с вами в ближайшее время.</p>
                    </div>
                  }
                >
                  <form class="space-y-4" onSubmit={handleSubmit}>
                    <FormField
                      id="name"
                      name="name"
                      label="Ваше имя"
                      required
                      autocomplete="name"
                      value={name}
                      onInput={setName}
                    />
                    <PhoneField id="phone" name="phone" required value={phone} onInput={setPhone} />
                    <FormField
                      id="message"
                      name="message"
                      label="Опишите задачу"
                      multiline
                      rows={4}
                      value={message}
                      onInput={setMessage}
                    />
                    <button
                      type="submit"
                      class="form-submit-btn"
                      disabled={!name().trim() || !isPhoneComplete(phone())}
                    >
                      Отправить заявку
                    </button>
                  </form>
                </Show>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <div class="container-narrow site-footer__inner">
          <div class="site-footer__col">
            <p class="site-footer__name">{SITE.name}</p>
            <p class="site-footer__meta">Проектирование и инжиниринг в Донецке</p>
            <address class="site-footer__address">
              <a href={`tel:${SITE.phones[0]}`}>{SITE.phonesDisplay[0]}</a>
              <span aria-hidden="true"> · </span>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              <span class="site-footer__address-line">{SITE.address.full}</span>
            </address>
          </div>

          <nav class="site-footer__nav" aria-label="Разделы сайта">
            <For each={NAV}>
              {(item) => (
                <a href={item.href} class="site-footer__link">
                  {item.label}
                </a>
              )}
            </For>
          </nav>

          <div class="site-footer__legal">
            <p>© {new Date().getFullYear()} {SITE.name}</p>
            <p>ИНН: {SITE.inn} · ОГРН: {SITE.ogrn}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
