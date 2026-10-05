import type { Metadata, Viewport } from 'next'

import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { fontVariables } from '@/lib/fonts'
import { SITE_URL, site } from '@/lib/site'

import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${site.name}: малки приложения и сайтове от ${site.author.name}`,
    template: `%s | ${site.name}`,
  },
  description:
    'Всичко, което правя, на едно място: приложения за всекидневни дребни проблеми и сайтове за хора с малък бизнес.',
  applicationName: site.name,
  authors: [{ name: site.author.name, url: `${SITE_URL}/za-men` }],
  creator: site.author.name,
  openGraph: {
    type: 'website',
    locale: site.locale,
    siteName: site.name,
  },
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1013' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="bg" className={fontVariables} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="bg-foreground text-background fixed top-2 left-2 z-50 -translate-y-24 px-4 py-3 focus:translate-y-0"
        >
          Към съдържанието
        </a>
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
