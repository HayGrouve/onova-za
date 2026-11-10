import { defineProject } from '@/lib/project-schema'

import claim from './claim.webp'

export default defineProject({
  slug: 'onova-za-smetkata',
  name: 'Онова за сметката',
  za: 'сметката',
  pitch:
    'Снимаш бележката, всеки отбелязва своето и връща парите на един човек.',
  description:
    'Приложение за разделяне на сметка в ресторант: снимате бележката, всеки отбелязва какво е ял и пил и връща парите с Revolut или по IBAN.',
  owner: 'own',
  type: 'app',
  status: 'live',
  topics: ['pari', 'hrana'],
  years: { from: 2026 },
  updatedAt: '2026-10-05',
  seo: { title: 'Онова за сметката: разделяне на сметка по артикули' },
  links: {
    live: 'https://www.onova-za-smetkata.com',
    github: 'https://github.com/HayGrouve/onova-za-smetkata',
  },
  featured: true,
  hue: 38,
  cover: {
    src: claim,
    frame: 'phone',
    alt: 'Сметка от „Механа Чучура“ на телефон: до всеки ред са инициалите на хората, които са го взели, а отдолу е дялът на госта, 7,50 €.',
  },
  body: {
    about:
      'Онова за сметката е за вечерите, на които всеки е поръчал различно и никой не иска да дели поравно. Снимаш бележката, пращаш линк на масата и всеки от своя телефон отбелязва какво е ял и пил. После връща своя дял на този, който е платил, с Revolut или по IBAN. Без регистрация.',
  },
  related: ['onova-za-kuhnyata', 'onova-za-kafeto'],
})
