import { defineProject } from '@/lib/project-schema'

import home from './home.webp'
import mobile from './mobile.webp'

export default defineProject({
  slug: 'iliaora',
  name: 'Iliaora',
  za: 'сладкишите',
  pitch: 'Сайт за торти и донъти по поръчка в София.',
  description:
    'Сайт за Iliaora, сладкиши по поръчка в София: торти, донъти и торти за повод. Поръчката е с обаждане или във Viber, а снимките водят към Instagram.',
  owner: 'client',
  client: { name: 'Iliaora, София' },
  type: 'site',
  status: 'live',
  topics: ['hrana', 'biznes'],
  years: { from: 2026 },
  updatedAt: '2026-08-18',
  seo: { title: 'Iliaora: сайт за торти и донъти по поръчка' },
  links: { live: 'https://iliaora.com' },
  featured: true,
  hue: 350,
  cover: {
    src: home,
    frame: 'browser',
    alt: 'Началото на Iliaora: името, „Нашият десерт по ваш вкус!“, бутони за обаждане и Viber и снимка на мъфини с цветни пръчици.',
  },
  screens: [
    {
      src: mobile,
      frame: 'phone',
      alt: 'Iliaora на телефон: името, кратко описание и двата бутона за поръчка.',
    },
  ],
  body: {
    useCases: [
      'Някой в София търси торта за рожден ден и пише директно във Viber.',
      'Двойка, която планира сватба, разглежда тортите за повод и пита за доставка в страната.',
      'Каталогът е в Instagram: сайтът води натам, вместо да го дублира.',
    ],
    why: 'Сладкишите се правят по поръчка: няма магазин и нищо не стои на рафт. Затова сайтът не е онлайн магазин. Казва какво се прави, показва няколко снимки и прави поръчката възможно най-лесна, с обаждане или съобщение. Преди първия ред код записах речник на термините и тона, за да говорим с клиента за едно и също нещо.',
    state: 'Работи на живо от август 2026.',
  },
  related: ['a-el-key', 'stefi-auto-gas'],
})
