import { ArrowUpRight, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'

import { JsonLd } from '@/components/json-ld'
import { buttonVariants } from '@/components/ui/button'
import { paths } from '@/lib/paths'
import { projects } from '@/lib/projects'
import { pageMeta, profileGraph } from '@/lib/seo'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'

export const metadata: Metadata = pageMeta({
  path: paths.about(),
  title: `За мен: ${site.author.name}, уеб разработчик`,
  description:
    'Цветомир Цеков, уеб разработчик от София. Защо проектите ми се казват „онова за“ и как да ми пишеш.',
})

// The newest project update doubles as the page's own "last modified".
const lastUpdate =
  projects
    .map((p) => p.updatedAt)
    .sort()
    .at(-1) ?? '2026-10-05'

const h2 =
  'font-display text-[clamp(1.875rem,3vw,2.375rem)] leading-none font-extrabold'

export default function AboutPage() {
  const { author } = site
  return (
    <main id="main" className="shell">
      <JsonLd data={profileGraph(lastUpdate)} />
      <div className="grid gap-14 pt-[clamp(2rem,5vw,3.5rem)] lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-16">
        <div className="max-w-[42rem]">
          <h1 className="font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] font-extrabold tracking-[-0.01em]">
            {author.name}
          </h1>
          <p className="mt-4 text-xl leading-snug text-pretty">
            Уеб разработчик от София. Правя малки приложения за големите
            проблеми.
          </p>
        </div>

        <section aria-labelledby="pishi-mi" className="scroll-mt-6">
          <h2 id="pishi-mi" className={h2}>
            Пиши ми
          </h2>
          <p className="mt-4 text-[1.0625rem] leading-relaxed">
            Имаш идея или поръчка?
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={`mailto:${author.email}`}
              className={cn(
                buttonVariants(),
                'h-11 gap-3 px-4 text-base font-semibold',
              )}
            >
              <EnvelopeSimple size={20} weight="bold" aria-hidden="true" />
              {author.email}
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-semibold">
            <li>
              <a
                href={author.profiles.github}
                className="link-quiet inline-flex items-center gap-1"
              >
                GitHub
                <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a
                href={author.profiles.linkedin}
                className="link-quiet inline-flex items-center gap-1"
              >
                LinkedIn
                <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
              </a>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
