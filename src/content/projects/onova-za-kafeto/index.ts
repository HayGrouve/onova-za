import { defineProject } from '@/lib/project-schema'

import shelf from './shelf.webp'

export default defineProject({
  slug: 'onova-za-kafeto',
  name: 'Онова за кафето',
  za: 'кафето',
  pitch: 'Помни на колко да мелиш всяко кафе, което някога си купувал.',
  description:
    'Дневник за финост на мелене за специално кафе: снимаш пакета, записваш опитите и закачаш настройката, която е вкусна. Пази се в Акаунта ти, на всяко устройство.',
  owner: 'own',
  type: 'app',
  status: 'live',
  topics: ['kafe', 'hrana'],
  years: { from: 2026 },
  updatedAt: '2026-11-10',
  seo: { title: 'Онова за кафето: дневник за мелене на кафе' },
  uiLanguage: 'bg',
  links: {
    live: 'https://kafeto.onovaza.com',
    github: 'https://github.com/HayGrouve/dial-in',
  },
  featured: true,
  akaunt: { subdomain: 'kafeto' },
  hue: 64,
  cover: {
    src: shelf,
    frame: 'phone',
    alt: 'Рафтът в Онова за кафето: последното варене на Decaf Huila, еспресо на настройка 1.5, а отдолу пакетите на рафта.',
  },
  body: {
    about:
      'Всяко ново кафе се настройва наново, а когато го купиш пак след месеци, числото отдавна е забравено. Онова за кафето пази настройката на мелачката за всеки метод на всяко кафе и ти я показва, щом отвориш пакета. Дневникът е в Акаунта ти, на всяко устройство, затова иска връзка с интернет.',
  },
  related: ['onova-za-kuhnyata', 'onova-za-smetkata'],
})
