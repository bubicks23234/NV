import { SITE, absoluteUrl } from './seo.js';

export function buildJsonLd() {
  const site = absoluteUrl();
  const orgId = `${site}#organization`;
  const websiteId = `${site}#website`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: site,
        name: SITE.name,
        description: SITE.description,
        inLanguage: SITE.language,
        publisher: { '@id': orgId },
      },
      {
        '@type': ['Organization', 'LocalBusiness', 'ProfessionalService'],
        '@id': orgId,
        name: SITE.name,
        legalName: SITE.name,
        url: site,
        logo: absoluteUrl(SITE.logo),
        image: [absoluteUrl(SITE.ogImage), absoluteUrl('/images/cam7.jpg')],
        description: SITE.description,
        email: SITE.email,
        telephone: SITE.phones,
        taxID: SITE.inn,
        identifier: {
          '@type': 'PropertyValue',
          name: 'ОГРН',
          value: SITE.ogrn,
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: SITE.address.street,
          addressLocality: SITE.address.locality,
          addressRegion: SITE.address.region,
          postalCode: SITE.address.postalCode,
          addressCountry: SITE.address.country,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: SITE.geo.latitude,
          longitude: SITE.geo.longitude,
        },
        areaServed: [
          { '@type': 'City', name: 'Донецк' },
          { '@type': 'AdministrativeArea', name: 'Донецкая Народная Республика' },
        ],
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: SITE.phonesDisplay[0].replace(/\s/g, '-').replace(/[()]/g, ''),
            contactType: 'customer service',
            email: SITE.email,
            areaServed: 'RU',
            availableLanguage: ['Russian'],
          },
        ],
        knowsAbout: [
          'архитектурное проектирование',
          'инжиниринг',
          'проектирование жилых комплексов',
          'благоустройство территорий',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${site}#breadcrumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: site },
          { '@type': 'ListItem', position: 2, name: 'О компании', item: `${site}#about` },
          { '@type': 'ListItem', position: 3, name: 'Услуги', item: `${site}#services` },
          { '@type': 'ListItem', position: 4, name: 'Галерея', item: `${site}#gallery` },
          { '@type': 'ListItem', position: 5, name: 'Контакты', item: `${site}#contact` },
        ],
      },
    ],
  };
}
