import { defineProject } from '@/lib/project-schema'

import cover from './cover.webp'

export default defineProject({
  slug: 'onova-za-imotite',
  name: 'Онова за имотите',
  za: 'имотите',
  pitch:
    'Всички обяви от търсене в imot.bg в един списък и на карта, с цена на м².',
  description:
    'Търсиш в imot.bg, а приложението прибира всички намерени обяви в списък и на карта. Филтри, цена на м², история на цените и лични бележки.',
  owner: 'own',
  type: 'app',
  status: 'live',
  topics: ['dom', 'pari'],
  years: { from: 2026 },
  updatedAt: '2026-10-12',
  seo: { title: 'Онова за имотите: обявите от imot.bg на карта' },
  links: {
    live: 'https://onova-za-imotite.vercel.app',
    github: 'https://github.com/HayGrouve/onova-za-imotite',
  },
  hue: 350,
  cover: {
    src: cover,
    frame: 'browser',
    alt: 'Вили за продан в област Габрово: списък със снимки, площ, двор и цена на м², а до него карта с кръгове по села, оцветени по цена на м².',
  },
  body: {
    about:
      'Онова за имотите е за всеки, който търси жилище или къща в imot.bg и му писна да отваря обява по обява. Попълваш търсенето както в imot.bg, а приложението прибира всички намерени обяви, с пълните описания и снимки. Подреждаш ги по цена или по цена на м², гледаш ги на карта по села и квартали и виждаш кои са поевтинели.',
  },
  related: ['onova-za-klientite', 'onova-za-smetkata'],
})
