import {
  Overpass_Mono,
  Sofia_Sans,
  Sofia_Sans_Extra_Condensed,
} from 'next/font/google'

// Sofia Sans (Lettersoup, Sofia) draws Bulgarian Cyrillic forms by default,
// so "онова за" looks Bulgarian even where `lang` is lost (OG images).
export const textFont = Sofia_Sans({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-text',
  display: 'swap',
})

export const displayFont = Sofia_Sans_Extra_Condensed({
  subsets: ['latin', 'cyrillic'],
  weight: ['700', '800'],
  variable: '--font-display',
  display: 'swap',
})

// The one monospace verified to carry Bulgarian locl forms.
export const monoFont = Overpass_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
})

export const fontVariables = [
  textFont.variable,
  displayFont.variable,
  monoFont.variable,
].join(' ')
