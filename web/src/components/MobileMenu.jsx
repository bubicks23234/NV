import { For, Show, createEffect, onCleanup } from 'solid-js';
import { Transition } from 'solid-transition-group';
import { Logo } from './Logo';
import { UiIcon } from './UiIcon';

export function MobileMenu(props) {
  createEffect(() => {
    if (props.open()) document.body.classList.add('menu-open');
  });

  onCleanup(() => document.body.classList.remove('menu-open'));

  const unlockScroll = () => document.body.classList.remove('menu-open');

  return (
    <>
      <Transition name="fs-backdrop">
        <Show when={props.open()}>
          <div
            class="mobile-menu-backdrop md:hidden fixed inset-0 z-[600]"
            onClick={props.onClose}
          />
        </Show>
      </Transition>

      <Transition name="fs-panel" onAfterExit={unlockScroll}>
        <Show when={props.open()}>
          <nav class="mobile-menu-panel md:hidden fixed inset-0 z-[601] flex flex-col" aria-label="Мобильная навигация">
            <div class="mobile-menu-panel__inner">
              <div class="mobile-menu-panel__accent" aria-hidden="true" />

              <header class="mobile-menu-header">
                <a href="#" class="mobile-menu-header__logo" onClick={props.onClose}>
                  <Logo variant="menu" />
                </a>
                <button type="button" class="mobile-menu-close" aria-label="Закрыть меню" onClick={props.onClose}>
                  <UiIcon name="x" class="w-5 h-5" />
                </button>
              </header>

              <div class="mobile-menu-body">
                <For each={props.items}>
                  {(item, i) => (
                    <a
                      href={item.href}
                      onClick={props.onClose}
                      class="mobile-menu-link"
                      style={{ '--i': i() }}
                    >
                      <span class="mobile-menu-link__num">0{i() + 1}</span>
                      <span class="mobile-menu-link__text">{item.label}</span>
                      <UiIcon name="chevronRight" class="mobile-menu-link__arrow w-5 h-5" />
                    </a>
                  )}
                </For>
              </div>

              <footer class="mobile-menu-footer">
                <a href="tel:+79494096881" class="mobile-menu-phone" onClick={props.onClose}>
                  +7 (949) 409-68-81
                </a>
                <a href="#contact" onClick={props.onClose} class="mobile-menu-cta">
                  Обсудить проект
                </a>
              </footer>
            </div>
          </nav>
        </Show>
      </Transition>
    </>
  );
}
