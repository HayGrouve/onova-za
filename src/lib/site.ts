// The production origin. NEXT_PUBLIC_SITE_URL can override it (e.g. for a
// staging host); otherwise it falls back to the live domain, onovaza.com.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onovaza.com'
).replace(/\/$/, '')

export const site = {
  name: 'онова за',
  latinName: 'Onova za',
  locale: 'bg_BG',
  author: {
    name: 'Цветомир Цеков',
    latinName: 'Tsvetomir Tsekov',
    handle: 'HayGrouve',
    role: 'Full-stack уеб разработчик',
    city: 'София',
    email: 'tsvetomir.kr.tsekov@gmail.com',
    profiles: {
      github: 'https://github.com/HayGrouve',
      linkedin: 'https://www.linkedin.com/in/tsvetomir-tsekov-a9317b1b3/',
    },
  },
} as const
