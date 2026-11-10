import { defineProject } from '@/lib/project-schema'

import shelf from './shelf.webp'

export default defineProject({
  slug: 'dial-in',
  name: 'Dial In',
  za: 'кафето',
  pitch: 'Помни на колко да мелиш всяко кафе, което някога си купувал.',
  description:
    'Дневник за финост на мелене за специално кафе: снимаш пакета, записваш опитите и закачаш настройката, която е вкусна. Работи офлайн.',
  owner: 'own',
  type: 'app',
  status: 'live',
  topics: ['kafe', 'hrana'],
  years: { from: 2026 },
  updatedAt: '2026-10-05',
  seo: { title: 'Dial In: дневник за мелене на кафе' },
  uiLanguage: 'en',
  links: {
    live: 'https://dial-in-three.vercel.app',
    github: 'https://github.com/HayGrouve/dial-in',
  },
  featured: true,
  hue: 64,
  cover: {
    src: shelf,
    frame: 'phone',
    alt: 'Рафтът в Dial In: последното варене на Kirinyaga AA с AeroPress на настройка 4, а отдолу пакетите на рафта.',
  },
  body: {
    about:
      'Всяко ново кафе се настройва наново, а когато го купиш пак след месеци, числото отдавна е забравено. Dial In пази настройката на мелачката за всеки метод на всяко кафе и ти я показва, щом отвориш пакета. Работи офлайн и без акаунт.',
  },
  related: ['onova-za-kuhnyata', 'onova-za-smetkata'],
})
