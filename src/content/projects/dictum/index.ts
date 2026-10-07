import { defineProject } from '@/lib/project-schema'

export default defineProject({
  slug: 'dictum',
  name: 'Dictum',
  za: 'приказките',
  pitch: 'Задържаш клавиш, говориш и текстът се появява там, където пишеш.',
  description:
    'Диктовка за Windows, която работи изцяло на компютъра: без акаунт, без облак и без история. Разбира 25 езика, сред тях български и английски.',
  owner: 'own',
  type: 'desktop',
  status: 'live',
  topics: ['kod'],
  years: { from: 2026 },
  updatedAt: '2026-10-07',
  seo: { title: 'Dictum: диктовка на гласа в текст за Windows' },
  uiLanguage: 'en',
  links: {
    download: 'https://github.com/HayGrouve/dictum/releases/latest',
    github: 'https://github.com/HayGrouve/dictum',
  },
  hue: 190,
  body: {
    about:
      'Dictum е за всичко, което е по-бързо да кажеш, отколкото да напишеш. Задържаш клавиша, говориш и пускаш, а текстът се появява в програмата, в която си, с препинателните знаци. Гласът не излиза от компютъра и не се записва никъде. Разпознава 25 езика, сред тях български.',
  },
  related: ['onova-za-klientite', 'dial-in'],
})
