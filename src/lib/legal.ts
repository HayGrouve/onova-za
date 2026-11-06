import { site } from './site'

// Who runs онова за, as the privacy policy and the terms name it (GDPR
// чл. 13, ЗЕТ чл. 4). The owner is a private individual and the one
// controller for the hub and every own project (#31, decision 3).
export const controller = {
  name: site.author.name,
  email: 'privacy@onovaza.com',
  // OWNER: fill in the correspondence address before merge (#50). While it is
  // null the page shows a loud placeholder, and a production build fails.
  address: null as string | null,
}

if (controller.address === null && process.env.VERCEL_ENV === 'production') {
  throw new Error(
    'src/lib/legal.ts: controller.address is empty. Fill in the correspondence address before deploying to production.',
  )
}

export type LegalChange = { date: string; text: string }

// "В сила от" is the date of the newest entry. Add a new entry on top for
// every change; material changes also get a notice on /akaunt and /vhod for
// 30 days (#31, decision 10).
export const privacyChanges: readonly LegalChange[] = [
  { date: '2026-11-06', text: 'Публикувана.' },
]

export const termsChanges: readonly LegalChange[] = [
  { date: '2026-11-06', text: 'Публикувани.' },
]

export const effectiveDate = (changes: readonly LegalChange[]) =>
  changes[0].date

const dateFormat = new Intl.DateTimeFormat('bg', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

// "6 ноември 2026 г."
export const formatLegalDate = (iso: string) =>
  dateFormat.format(new Date(`${iso}T00:00:00Z`))
