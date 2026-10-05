// Facets every project is described by. Labels are the Bulgarian words shown
// in the UI; keys are stable ids used in data, URLs and CSS hooks.

export const STATUSES = {
  live: {
    label: 'На живо',
    hint: 'Работи и се ползва.',
  },
  building: {
    label: 'В правене',
    hint: 'Работя по него в момента.',
  },
  experiment: {
    label: 'Експеримент',
    hint: 'Проба, която може и да не порасне.',
  },
  archived: {
    label: 'Архив',
    hint: 'Не се поддържа. Стои тук за спомен и за пример.',
  },
} as const

export const OWNERS = {
  own: { label: 'Мое', plural: 'Мои' },
  client: { label: 'За клиент', plural: 'За клиенти' },
} as const

export const TYPES = {
  app: { label: 'Приложение' },
  site: { label: 'Сайт' },
  system: { label: 'Система' },
  desktop: { label: 'Десктоп' },
} as const

// Topics feed "related projects" today and topic pages once a topic has 3+
// projects. Never shown on cards.
export const TOPICS = {
  pari: 'пари',
  hrana: 'храна',
  kafe: 'кафе',
  kod: 'код',
  pochivka: 'почивка',
  svatba: 'сватба',
  avto: 'коли',
  zhivotni: 'животни',
  dom: 'дом',
  biznes: 'малък бизнес',
} as const
