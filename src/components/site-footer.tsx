import Link from 'next/link'

import { paths } from '@/lib/paths'
import { site } from '@/lib/site'

// On every page: Google's brand verification checks that the home page links
// the privacy policy, at the same URL as the OAuth consent screen.
export function SiteFooter() {
  const { author } = site
  return (
    <footer className="border-border mt-24 border-t">
      <div className="shell flex flex-col gap-4 py-8 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground">
            {author.name}, уеб разработчик, {author.city}
          </p>
          <ul className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link href={paths.privacy()} className="link-prose">
                Поверителност
              </Link>
            </li>
            <li>
              <Link href={paths.terms()} className="link-prose">
                Условия
              </Link>
            </li>
          </ul>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 font-semibold">
          <li>
            <a href={author.profiles.github} className="link-quiet">
              GitHub
            </a>
          </li>
          <li>
            <a href={author.profiles.linkedin} className="link-quiet">
              LinkedIn
            </a>
          </li>
          <li>
            <a href={`mailto:${author.email}`} className="link-quiet">
              {author.email}
            </a>
          </li>
        </ul>
      </div>
    </footer>
  )
}
