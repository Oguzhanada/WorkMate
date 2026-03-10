import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WorkMate — Ireland\u2019s Home Services Marketplace',
    short_name: 'WorkMate',
    description:
      'Connecting Irish homeowners with trusted local professionals for home services.',
    start_url: '/',
    display: 'standalone',
    background_color: '#eef3f1',
    theme_color: '#10b981',
    orientation: 'portrait-primary',
    categories: ['business', 'lifestyle'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
