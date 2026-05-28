import { UiIcon } from './UiIcon';

const ADDRESS = '283003, Донецк, проспект Дзержинского, 69Б';
const COORDS = '37.787776,48.041543';
const MAP_EMBED = `https://yandex.ru/map-widget/v1/?ll=37.787776%2C48.041543&z=17&pt=37.787776%2C48.041543%2Cpm2org&l=map`;
const MAP_LINK = `https://yandex.ru/maps/?pt=${COORDS}&z=17&l=map&text=${encodeURIComponent(ADDRESS)}`;

export function YandexMap() {
  return (
    <div class="yandex-map">
      <div class="yandex-map__header">
        <p class="font-semibold text-slate-800 text-sm">Как нас найти</p>
        <a
          href={MAP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          class="yandex-map__link"
        >
          Открыть в Яндекс Картах
          <UiIcon name="externalLink" class="w-4 h-4" />
        </a>
      </div>
      <div class="yandex-map__frame-wrap">
        <iframe
          title="Офис ООО «Новые технологии» на карте"
          src={MAP_EMBED}
          class="yandex-map__frame"
          loading="lazy"
          allowfullscreen
        />
      </div>
      <p class="yandex-map__address">{ADDRESS}, оф. 31</p>
    </div>
  );
}
