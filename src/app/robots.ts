import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'], // Protect administrative zones from robots
    },
    sitemap: 'https://spicycommunity.online/sitemap.xml',
  };
}
