import { site } from '@/lib/site'

export function SiteFooter() {
  const { author } = site
  return (
    <footer className="border-border mt-24 border-t">
      <div className="shell flex flex-col gap-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          {author.name}, уеб разработчик, {author.city}
        </p>
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
