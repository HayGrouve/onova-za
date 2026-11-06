import { site } from './site'

// Who runs онова за, as the privacy policy and the terms name it (GDPR
// чл. 13, ЗЕТ чл. 4). The owner is a private individual and the one
// controller for the hub and every own project (#31, decision 3).
export const controller = {
  name: site.author.name,
  email: 'privacy@onovaza.com',
  address: 'София, Йордан Стратиев 1',
}

// `material` marks a change people must hear about: /akaunt (and /vhod)
// show it as a notice for 30 days from its date (#31, decision 10).
export type LegalChange = { date: string; text: string; material?: true }

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

export type LegalNotice = LegalChange & { page: 'privacy' | 'terms' }

const NOTICE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

// The material changes still inside their 30 days on `now`, newest first.
// Empty at launch: no change is material yet.
export function legalNotices(
  now: Date,
  changes: {
    privacy: readonly LegalChange[]
    terms: readonly LegalChange[]
  } = {
    privacy: privacyChanges,
    terms: termsChanges,
  },
): LegalNotice[] {
  const pages = ['privacy', 'terms'] as const
  return pages
    .flatMap((page) =>
      changes[page].filter((c) => c.material).map((c) => ({ ...c, page })),
    )
    .filter(
      (c) =>
        now.getTime() <
        Date.parse(`${c.date}T00:00:00Z`) + NOTICE_DAYS * DAY_MS,
    )
    .sort((a, b) => b.date.localeCompare(a.date))
}

const dateFormat = new Intl.DateTimeFormat('bg', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

// "6 ноември 2026 г."
export const formatLegalDate = (iso: string) =>
  dateFormat.format(new Date(`${iso}T00:00:00Z`))
