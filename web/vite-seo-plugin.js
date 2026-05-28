import fs from 'node:fs';
import path from 'node:path';
import { SITE, absoluteUrl, SECTIONS } from './src/data/seo.js';
import { buildJsonLd } from './src/data/schema.js';

function writeSeoFiles(publicDir) {
  const site = absoluteUrl();

  const robots = `User-agent: *
Allow: /

User-agent: Yandex
Allow: /
Crawl-delay: 1

Sitemap: ${site}sitemap.xml
`;

  const urls = [
    { loc: site, priority: '1.0', changefreq: 'weekly' },
    ...SECTIONS.map((s) => ({
      loc: `${site}#${s.id}`,
      priority: s.id === 'services' ? '0.9' : '0.8',
      changefreq: 'monthly',
    })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots);
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
}

export function seoPlugin() {
  let publicDir = '';

  return {
    name: 'seo-plugin',
    configResolved(config) {
      publicDir = config.publicDir;
      writeSeoFiles(publicDir);
    },
    transformIndexHtml(html) {
      const site = absoluteUrl();
      const jsonLd = JSON.stringify(buildJsonLd(), null, 2).replace(/</g, '\\u003c');

      return html
        .replaceAll('__SITE_URL__', site)
        .replaceAll('__SITE_TITLE__', SITE.title)
        .replaceAll('__SITE_DESCRIPTION__', SITE.description)
        .replaceAll('__SITE_KEYWORDS__', SITE.keywords)
        .replaceAll('__SITE_NAME__', SITE.name)
        .replaceAll('__OG_IMAGE__', absoluteUrl(SITE.ogImage))
        .replace('__JSON_LD__', jsonLd);
    },
  };
}
