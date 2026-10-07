import { defineProject } from '@/lib/project-schema'

import today from './today.webp'

export default defineProject({
  slug: 'onova-za-klientite',
  name: 'Онова за клиентите',
  za: 'клиентите',
  pitch:
    'Клиенти, поръчки и пари на малкия бизнес в телефона, вместо в тефтер.',
  description:
    'Приложение за малък бизнес с услуги: клиенти, поръчки, срещи, плащания и разходи. Сам решаваш как се казват нещата и какви етапи минава работата.',
  owner: 'own',
  type: 'system',
  status: 'building',
  topics: ['biznes', 'pari'],
  featured: true,
  years: { from: 2026 },
  updatedAt: '2026-10-07',
  seo: { title: 'Онова за клиентите: клиенти, поръчки и пари' },
  links: {
    live: 'https://onova-za-klientite.vercel.app',
  },
  hue: 245,
  cover: {
    src: today,
    frame: 'phone',
    alt: 'Екранът „Днес“ на пробна мебелна работилница: две закъснели поръчки, две със срок до 3 дни и готови, но неплатени, с остатъка за всяка.',
  },
  body: {
    about:
      'Онова за клиентите е за майстора, който държи поръчките в тефтер, а парите в главата си. Записваш поръчката на един ред, както в тефтера, и тя минава през твоите етапи. Сутрин виждаш срещите за деня, какво закъснява и кой още ти дължи пари. Става и за малък екип.',
  },
  related: ['onova-za-smetkata', 'dictum'],
})
