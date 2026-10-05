import { defineProject } from '@/lib/project-schema'

import checklist from './checklist.webp'

export default defineProject({
  slug: 'spisak-za-kamping',
  name: 'Списък за къмпинг',
  za: 'къмпинга',
  pitch: '78 неща за палатката, отметнати едно по едно, преди да тръгнеш.',
  description:
    'Списък за багаж за къмпинг със 78 неща в групи: в палатката, на открито, хигиена. Отметките се пазят в телефона, а прогресът се вижда отгоре.',
  owner: 'own',
  type: 'app',
  status: 'live',
  topics: ['pochivka'],
  years: { from: 2022 },
  updatedAt: '2026-10-02',
  seo: { title: 'Списък за къмпинг: какво да вземем с палатка' },
  links: {
    live: 'https://palatki.netlify.app',
    github: 'https://github.com/HayGrouve/camping',
  },
  featured: true,
  hue: 150,
  cover: {
    src: checklist,
    frame: 'browser',
    alt: 'Списъкът за къмпинг: вляво снимка на палатка в планината и 0% опаковано, вдясно групи като „В палатката“ и „На открито“ с отметки.',
  },
  body: {
    about:
      'Преди всяко пътуване с палатка нещо остава у дома. Списъкът за къмпинг събира 78 неща в групи като „В палатката“ и „На открито“, а ти ги отметваш едно по едно, докато товариш колата. Отметките се пазят в телефона и отгоре се вижда колко ти остава.',
  },
})
