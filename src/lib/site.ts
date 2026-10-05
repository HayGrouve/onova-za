// The production origin. The domain is not registered yet, so it is read from
// the environment and falls back to the intended one.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onova-za.com'
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
