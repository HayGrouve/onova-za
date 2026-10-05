import type { MetadataRoute } from 'next'

import { site } from '@/lib/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: 'Малки приложения и сайтове. Всяко е за нещо.',
    lang: 'bg',
    start_url: '/',
    display: 'browser',
    background_color: '#f5f7f9',
    theme_color: '#101419',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
