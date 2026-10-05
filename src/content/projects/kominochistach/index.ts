import { defineProject } from '@/lib/project-schema'

import home from './home.webp'
import mobile from './mobile.webp'

export default defineProject({
  slug: 'kominochistach',
  name: 'Коминочистач',
  za: 'комините',
  pitch: 'Сайт за почистване, отпушване и ремонт на комини в София.',
  description:
    'Сайт за коминочистач в София: почистване, отпушване и ремонт на комини и шапки, с галерия от обекти и бутон за обаждане.',
  owner: 'client',
  client: {
    name: 'Коминочистач, София',
    role: 'Първата версия през 2020 и пълното ѝ пренаписване през 2026: код, дизайн и SEO.',
  },
  type: 'site',
  status: 'live',
  topics: ['dom', 'biznes'],
  years: { from: 2020 },
  updatedAt: '2026-09-25',
  links: { live: 'https://komini-sofia.com' },
  stack: [
    { tech: 'react' },
    { tech: 'vite' },
    { tech: 'shadcn' },
    { tech: 'netlify' },
  ],
  hue: 12,
  cover: {
    src: home,
    frame: 'browser',
    alt: 'Началото на сайта: „Запушен комин?“ с оранжев бутон за обаждане и снимка на коминочистача до комин.',
  },
  screens: [
    {
      src: mobile,
      frame: 'phone',
      alt: 'Сайтът на телефон: заглавието, бутонът с телефона и „Вижте работата му“.',
    },
  ],
  body: {
    useCases: [
      'Комин е запушен преди зимата и някой търси коминочистач в София.',
      'Клиент разглежда снимки от реални обекти, преди да се обади.',
      'Телефонът е на първия екран, на всеки размер на екрана.',
    ],
    why: 'Сайтът започна през 2020 като Create React App с Bootstrap и стоя без промяна години наред. През 2026 го пренаписах за седмица: Vite, React 19, TypeScript и нов дизайн. Целта не се промени: човек със запушен комин да намери телефона за секунди.',
    how: [
      '**Миграция, не нов проект.** Махнах всичко от Create React App, Bootstrap и jQuery и преписах страниците една по една.',
      '**SEO в статичен сайт**: данни за местен бизнес, canonical и OG за всяка страница, sitemap и пренасочване на Netlify.',
      '**Галерията е данни**: 21 снимки с описание за незрящи в един файл, показани в lightbox.',
    ],
    state: 'Работи на живо. Обновен през септември 2026.',
  },
  related: ['stefi-auto-gas', 'a-el-key'],
})
