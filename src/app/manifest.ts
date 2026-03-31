import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Spicy Community',
    short_name: 'Spicy',
    description: 'Advanced tournament management system for the Spicy Community.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#ffaa00',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
