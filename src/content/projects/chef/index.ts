import { defineProject } from '@/lib/project-schema'

import home from './home.webp'

export default defineProject({
  slug: 'chef',
  name: 'Chef',
  za: 'кухнята',
  pitch:
    'Рецептите, менюто за седмицата и списъкът за пазаруване на едно място.',
  description:
    'Лична готварска книга: запазваш и внасяш рецепти, планираш седмичното меню и правиш списък за пазаруване. Има режим за готвене без разсейване.',
  owner: 'own',
  type: 'app',
  status: 'live',
  topics: ['hrana', 'dom'],
  years: { from: 2025 },
  updatedAt: '2026-10-05',
  seo: { title: 'Chef: рецепти, меню за седмицата и пазаруване' },
  uiLanguage: 'en',
  links: {
    live: 'https://armyant.app',
    github: 'https://github.com/HayGrouve/chef',
  },
  featured: true,
  hue: 125,
  cover: {
    src: home,
    frame: 'browser',
    alt: 'Началната страница на Chef: търсене по съставки и най-новата рецепта, шоколадови бисквити с парченца шоколад.',
  },
  body: {
    about:
      'Chef събира рецептите, които иначе са разпилени по отметки, снимки на екрана и бележки в телефона. Внасяш рецепта от сайт с линк, правиш менюто за седмицата и от него излиза списъкът за пазаруване. Докато готвиш, на екрана е само следващата стъпка.',
  },
  related: ['onova-za-kafeto', 'onova-za-smetkata'],
})
