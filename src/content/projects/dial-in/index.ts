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
    caption: 'С примерни кафета.',
  },
  body: {
    useCases: [
      'Купуваш отново кафе, което ти е харесало преди месеци, и започваш от правилната настройка.',
      'Настройваш еспресо и записваш доза, добив, време и вкус, докато уцелиш.',
      'Имаш Fellow Opus и искаш да знаеш точно докъде да завъртиш вътрешния пръстен.',
    ],
    why: 'Всяко ново кафе се настройва наново: по-фино, по-едро, още веднъж. Когато купиш същото кафе след няколко месеца, числото отдавна е забравено. Dial In пази по една „точна“ настройка за всеки метод на всяко кафе и я показва голяма, щом отвориш пакета. Нарочно няма акаунти и сървър: за дневник на кафето не трябват.',
    limits:
      'Интерфейсът е на английски, а помощникът за мелачка е само за първия Fellow Opus, не за Opus 2.',
  },
  related: ['chef', 'onova-za-smetkata'],
})
