'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import type { UserResource } from '@clerk/nextjs/types'
import { SignOut } from '@phosphor-icons/react'
import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatLegalDate, legalNotices, type LegalChange } from '@/lib/legal'
import { paths } from '@/lib/paths'

import { DeleteTab } from './delete-tab'
import { ProfileTab } from './profile-tab'
import { ProjectsTab } from './projects-tab'
import { ReverificationProvider } from './reverification'
import type { PanelProject } from './types'
import { VhodTab } from './vhod-tab'

// The hash is the tab, so a project's "Данни" can link straight to
// /akaunt#iztrivane.
const TABS = [
  { id: 'profil', label: 'Профил' },
  { id: 'vhod', label: 'Вход' },
  { id: 'proekti', label: 'Проекти' },
  { id: 'iztrivane', label: 'Изтриване' },
] as const

type TabId = (typeof TABS)[number]['id']

const isTab = (value: string): value is TabId =>
  TABS.some((t) => t.id === value)

const h2 =
  'font-display text-[clamp(1.5rem,2.5vw,2rem)] leading-none font-extrabold'

type Props = {
  projects: PanelProject[]
  legalChanges: { privacy: LegalChange[]; terms: LegalChange[] }
}

// Everything below the heading. Clerk decides what shows: nothing while it
// loads (and forever in a build without a publishable key), Вход for
// someone signed out, the panel for someone signed in.
export function AkauntPanel({ projects, legalChanges }: Props) {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  // Изход and Изтрий Акаунта sign you out on purpose and go to "/" instead
  // of Вход; this is what the page says until they get there. The panel
  // stays up until Clerk reports the sign-out, since a delete may still ask
  // for a fresh code on the way.
  const [leaving, setLeaving] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || isSignedIn || leaving !== null) return
    router.replace(paths.vhod(`${paths.akaunt()}${window.location.hash}`))
  }, [isLoaded, isSignedIn, leaving, router])

  if (!isLoaded || !isSignedIn) {
    return (
      <Frame>
        <p role="status" className="text-muted-foreground p-6 md:p-8">
          {leaving ??
            (isLoaded ? 'Пращаме те към Вход.' : 'Зареждаме Акаунта ти.')}
        </p>
      </Frame>
    )
  }

  return (
    <SignedIn
      user={user}
      projects={projects}
      legalChanges={legalChanges}
      leave={setLeaving}
    />
  )
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="border-border mt-10 min-h-[22rem] border">{children}</div>
  )
}

const WIDE = '(min-width: 48rem)'

function subscribeWide(onChange: () => void) {
  const query = window.matchMedia(WIDE)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function SignedIn({
  user,
  projects,
  legalChanges,
  leave,
}: Props & { user: UserResource; leave: (message: string | null) => void }) {
  const { signOut } = useClerk()
  // This only renders in the browser (Clerk is loaded), so reading the hash
  // and the viewport here never mismatches the static HTML.
  const [tab, setTab] = useState<TabId>(() => {
    const hash = window.location.hash.slice(1)
    return isTab(hash) ? hash : 'profil'
  })
  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => true,
  )
  const notices = useMemo(
    () => legalNotices(new Date(), legalChanges),
    [legalChanges],
  )

  const choose = (value: string) => {
    if (!isTab(value)) return
    setTab(value)
    window.history.replaceState(null, '', `#${value}`)
  }

  return (
    <ReverificationProvider>
      {notices.map((n) => (
        <LegalNoticeLine key={`${n.page}-${n.date}`} notice={n} />
      ))}
      <Tabs
        value={tab}
        onValueChange={choose}
        orientation={wide ? 'vertical' : 'horizontal'}
        className="border-border mt-10 grid gap-0 border md:grid-cols-[14rem_minmax(0,1fr)]"
      >
        <div className="border-border bg-surface flex flex-row flex-wrap gap-1 border-b p-3 md:flex-col md:border-r md:border-b-0">
          <TabsList
            aria-label="Акаунт"
            className="h-auto w-auto flex-row flex-wrap items-stretch justify-start gap-1 bg-transparent p-0 group-data-horizontal/tabs:h-auto md:w-full md:flex-col"
          >
            {TABS.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="text-foreground data-active:bg-background dark:data-active:bg-background h-auto flex-none justify-start rounded-none border-0 px-3 py-2 text-base font-semibold data-active:shadow-none dark:data-active:border-transparent"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <span className="hidden flex-1 md:block" />
          <button
            type="button"
            onClick={() => {
              leave('Излизаш от Акаунта.')
              void signOut({ redirectUrl: paths.home() })
            }}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 px-3 py-2 text-left text-base font-semibold"
          >
            <SignOut size={18} weight="bold" aria-hidden="true" />
            Изход
          </button>
        </div>
        {TABS.map((t) => (
          <TabsContent
            key={t.id}
            value={t.id}
            className="min-h-[22rem] p-6 text-base md:p-8"
          >
            <h2 className={`${h2} mb-6`}>{t.label}</h2>
            {t.id === 'profil' && <ProfileTab user={user} />}
            {t.id === 'vhod' && <VhodTab user={user} />}
            {t.id === 'proekti' && <ProjectsTab projects={projects} />}
            {t.id === 'iztrivane' && (
              <DeleteTab
                user={user}
                projects={projects}
                onDeleting={(deleting) =>
                  leave(deleting ? 'Акаунтът ти е изтрит.' : null)
                }
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
      <p className="text-muted-foreground mt-6 text-sm">
        Изход те изкарва от всички проекти на онова за наведнъж.
      </p>
    </ReverificationProvider>
  )
}

const PAGES = {
  privacy: { name: 'Поверителността', href: paths.privacy() },
  terms: { name: 'Условията', href: paths.terms() },
} as const

// A material change to the legal pages, for 30 days from its date (#31).
function LegalNoticeLine({
  notice,
}: {
  notice: ReturnType<typeof legalNotices>[number]
}) {
  const page = PAGES[notice.page]
  return (
    <aside
      aria-label={`Промяна в ${page.name}`}
      className="border-foreground bg-surface mt-6 border-l-4 p-4"
    >
      <p className="text-pretty">
        <strong>
          {page.name} се променя{notice.page === 'terms' ? 'т' : ''} от{' '}
          <time dateTime={notice.date}>{formatLegalDate(notice.date)}</time>.
        </strong>{' '}
        {notice.text}{' '}
        <Link
          href={`${page.href}#promeni` as Route}
          prefetch={false}
          className="link-prose font-semibold"
        >
          Виж промените
        </Link>
      </p>
    </aside>
  )
}
