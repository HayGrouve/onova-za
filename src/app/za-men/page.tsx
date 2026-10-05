import { ArrowUpRight, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'
import Link from 'next/link'

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
      <div className="max-w-[42rem] pt-[clamp(2rem,5vw,3.5rem)]">
        <h1 className="font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] font-extrabold tracking-[-0.01em]">
          {author.name}
        </h1>
        <p className="mt-4 text-xl leading-snug text-pretty">
          Уеб разработчик от София. Правя малки приложения за неща, които ме
          дразнят, и сайтове за хора с малък бизнес.
        </p>

        <figure className="border-foreground mt-10 border-l-2 pl-5">
          <p className="text-lg leading-relaxed">
            <dfn className="font-display text-[1.6em] leading-none font-extrabold not-italic">
              онова за
            </dfn>{' '}
            Каквото казваш, когато не помниш как се казва нещо, но знаеш за
            какво е.
          </p>
          <blockquote className="font-display mt-2 text-[1.625rem] leading-tight font-bold">
            „Дай ми онова за отваряне на бутилки.“
          </blockquote>
        </figure>

        <div className="mt-10 space-y-4 text-[1.0625rem] leading-relaxed">
          <p>
            Така кръщавам и проектите си. Името се забравя, а за какво е,
            остава: онова за сметката, онова за кафето.{' '}
            <Link href={paths.projects()} className="link-prose">
              Виж всички проекти
            </Link>
            .
          </p>
        </div>

        <section aria-labelledby="pishi-mi" className="mt-14 scroll-mt-6">
          <h2 id="pishi-mi" className={h2}>
            Пиши ми
          </h2>
          <p className="mt-4 text-[1.0625rem] leading-relaxed">
            Имаш идея или поръчка? Пиши ми.
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
