import type { StaticImageData } from 'next/image'
import { z } from 'zod'

import { OWNERS, STATUSES, TOPICS, TYPES } from '@/content/taxonomy'

const keys = <T extends object>(o: T) =>
  Object.keys(o) as [Extract<keyof T, string>, ...Extract<keyof T, string>[]]

const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Latin lowercase words joined by hyphens')

const httpsUrl = z.url({ protocol: /^https$/ })

const isoDate = z.iso.date()

const image = z.custom<StaticImageData>(
  (v) =>
    typeof v === 'object' &&
    v !== null &&
    'src' in v &&
    'width' in v &&
    'height' in v,
  'Must be a static image import',
)

const shot = z.object({
  src: image,
  // Screenshots always carry information, so alt text is never empty.
  alt: z.string().trim().min(12).max(160),
  // How the image is framed on the page: a phone, a browser window or bare.
  frame: z.enum(['phone', 'browser', 'bare']),
  caption: z.string().max(140).optional(),
})

// One line of copy that may contain **bold**, `code` and [links](https://...).
const inline = z.string().trim().min(1)

export const projectSchema = z
  .object({
    slug,
    // Product name as people know it ("Dial In", "Онова за сметката").
    name: z.string().min(2).max(40),
    // Completes the sentence "онова за ___". Short and lowercase.
    za: z
      .string()
      .min(2)
      .max(28)
      .refine((s) => s === s.toLocaleLowerCase('bg'), 'Lowercase only'),
    // What it does, in one plain sentence. Shown on cards.
    pitch: z.string().min(10).max(80),
    // Meta description and structured-data description.
    description: z.string().min(70).max(165),
    owner: z.enum(keys(OWNERS)),
    client: z.object({ name: z.string() }).optional(),
    type: z.enum(keys(TYPES)),
    status: z.enum(keys(STATUSES)),
    topics: z
      .array(z.enum(keys(TOPICS)))
      .min(1)
      .max(3),
    years: z.object({
      from: z.number().int().min(2018).max(2100),
      to: z.number().int().min(2018).max(2100).optional(),
    }),
    updatedAt: isoDate,
    // Interface language of the product itself, when it is not Bulgarian.
    uiLanguage: z.enum(['bg', 'en']).default('bg'),
    links: z
      .object({
        live: httpsUrl.optional(),
        github: httpsUrl.optional(),
        download: httpsUrl.optional(),
      })
      .default({}),
    featured: z.boolean().default(false),
    // Accent hue (OKLCH degrees). Lightness and chroma come from the theme so
    // contrast holds for every hue. Keep hues 270 to 320 out.
    hue: z
      .number()
      .min(0)
      .max(360)
      .refine((h) => h < 270 || h > 320, 'Hue 270 to 320 is off limits'),
    cover: shot,
    screens: z.array(shot).max(4).default([]),
    body: z.object({
      // "За какво ти е": two or three concrete situations.
      useCases: z.array(inline).min(1).max(4),
      // "Защо го направих" (own) or "Задачата" (client). 30 to 120 words.
      why: inline,
      // One honest limit or thing I would change.
      limits: inline.optional(),
    }),
    related: z.array(slug).max(3).optional(),
    seo: z
      .object({
        // Search result title before " | онова за". About 50 characters keeps
        // the whole title visible in Google.
        title: z.string().max(52).optional(),
        noindex: z.boolean().optional(),
      })
      .optional(),
  })
  .superRefine((p, ctx) => {
    // `pnpm new:project` marks every placeholder with TODO.
    if (JSON.stringify(p).includes('TODO')) {
      ctx.addIssue({
        code: 'custom',
        path: [],
        message: 'Replace every TODO placeholder before publishing',
      })
    }
    if ((p.owner === 'client') !== Boolean(p.client)) {
      ctx.addIssue({
        code: 'custom',
        path: ['client'],
        message: 'The client name is required for client work, and only then',
      })
    }
    if (p.years.to && p.years.to < p.years.from) {
      ctx.addIssue({
        code: 'custom',
        path: ['years'],
        message: 'Ends before it starts',
      })
    }
    const words = p.body.why.split(/\s+/).length
    if (words < 25 || words > 130) {
      ctx.addIssue({
        code: 'custom',
        path: ['body', 'why'],
        message: `Keep "why" between 25 and 130 words (now ${words})`,
      })
    }
  })

export type ProjectInput = z.input<typeof projectSchema>
export type Project = z.output<typeof projectSchema>
export type Shot = Project['cover']

// Identity helper so project files get types and autocomplete.
export const defineProject = (p: ProjectInput) => p
