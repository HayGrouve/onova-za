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

export const TECH = {
  next: { name: 'Next.js', url: 'https://nextjs.org' },
  'tanstack-start': {
    name: 'TanStack Start',
    url: 'https://tanstack.com/start',
  },
  react: { name: 'React', url: 'https://react.dev' },
  vite: { name: 'Vite', url: 'https://vite.dev' },
  cra: { name: 'Create React App' },
  convex: { name: 'Convex', url: 'https://convex.dev' },
  clerk: { name: 'Clerk', url: 'https://clerk.com' },
  stripe: { name: 'Stripe', url: 'https://stripe.com' },
  tauri: { name: 'Tauri', url: 'https://tauri.app' },
  rust: { name: 'Rust', url: 'https://www.rust-lang.org' },
  tailwind: { name: 'Tailwind CSS', url: 'https://tailwindcss.com' },
  shadcn: { name: 'shadcn/ui', url: 'https://ui.shadcn.com' },
  dexie: { name: 'Dexie (IndexedDB)', url: 'https://dexie.org' },
  gemini: { name: 'Gemini API', url: 'https://ai.google.dev' },
  uploadthing: { name: 'UploadThing', url: 'https://uploadthing.com' },
  redis: { name: 'Redis' },
  jspdf: { name: 'jsPDF' },
  playwright: { name: 'Playwright', url: 'https://playwright.dev' },
  pwa: { name: 'PWA' },
  vercel: { name: 'Vercel', url: 'https://vercel.com' },
  netlify: { name: 'Netlify', url: 'https://www.netlify.com' },
} as const
