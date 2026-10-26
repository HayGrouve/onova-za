'use client'

// PROTOTYPE, throwaway (ticket #19): three looks for the hub's /akaunt.
// No Clerk: the person is fake, every action is a stub.

import {
  ArrowUpRight,
  EnvelopeSimple,
  GoogleLogo,
  SignOut,
} from '@phosphor-icons/react'
import { useState, type CSSProperties, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { PrototypeBar, setSignedIn } from './prototype-bar'
import type { ProtoProject } from './vhod-variants'

type AkauntProject = ProtoProject & { live?: string }

const VARIANTS = [
  { key: 'A', name: 'Табове' },
  { key: 'B', name: 'Един лист' },
  { key: 'C', name: 'Проектите отпред' },
]

const person = {
  name: 'Мария Петрова',
  initials: 'МП',
  email: 'maria@primer.bg',
  google: 'maria.petrova@gmail.com',
  since: 'октомври 2026',
}

const accentStyle = (hue: number) => ({ '--h': hue }) as CSSProperties

const zaList = (all: AkauntProject[]) => {
  const z = all.map((p) => p.za)
  return `${z.slice(0, -1).join(', ')} и ${z.at(-1)}`
}

const h2 =
  'font-display text-[clamp(1.5rem,2.5vw,2rem)] leading-none font-extrabold'

function signOut() {
  setSignedIn(false)
  window.location.href = '/'
}

function Avatar({ big }: { big?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-foreground text-background font-display flex shrink-0 items-center justify-center font-extrabold',
        big ? 'size-20 text-2xl' : 'size-12 text-base',
      )}
    >
      {person.initials}
    </span>
  )
}

function Identity({ big }: { big?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(person.name)
  return (
    <div className="flex items-center gap-5">
      <Avatar big={big} />
      <div className="min-w-0">
        {editing ? (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setEditing(false)
            }}
          >
            <Input
              aria-label="Име"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-base"
            />
            <Button type="submit" className="h-10">
              Запази
            </Button>
          </form>
        ) : (
          <p
            className={cn(
              'font-display leading-none font-extrabold',
              big ? 'text-[clamp(2.25rem,5vw,3.5rem)]' : 'text-2xl',
            )}
          >
            {name}
          </p>
        )}
        <p className="text-muted-foreground mt-2">
          {person.email} · с нас от {person.since}
          {!editing && (
            <>
              {' · '}
              <button
                className="link-quiet text-foreground font-semibold"
                onClick={() => setEditing(true)}
              >
                Промени името
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

function Methods() {
  return (
    <ul className="divide-border border-border divide-y border-y">
      <li className="flex items-center gap-4 py-4">
        <GoogleLogo size={22} weight="bold" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold">Google</p>
          <p className="text-muted-foreground text-sm">{person.google}</p>
        </div>
        <Button variant="ghost">Махни</Button>
      </li>
      <li className="flex items-center gap-4 py-4">
        <EnvelopeSimple size={22} weight="bold" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold">Код по имейл</p>
          <p className="text-muted-foreground text-sm">
            {person.email} (основен)
          </p>
        </div>
        <Button variant="ghost">Добави имейл</Button>
      </li>
    </ul>
  )
}

function ProjectsList({ all }: { all: AkauntProject[] }) {
  return (
    <>
      <ul className="divide-border border-border divide-y border-y">
        {all.map((p) => (
          <li
            key={p.slug}
            data-accent=""
            style={accentStyle(p.hue)}
            className="flex items-center gap-4 py-3"
          >
            <span className="bg-(--fill) size-3 shrink-0" />
            <span className="flex-1 font-semibold">онова за {p.za}</span>
            <a
              href={p.live ?? '#'}
              className="link-quiet inline-flex items-center gap-1 text-sm font-semibold"
            >
              Отвори
              <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-3 text-sm text-pretty">
        Данните си в един проект изтриваш от неговите настройки, в „Данни“.
        Акаунтът ти остава.
      </p>
    </>
  )
}

function SignOutButton() {
  return (
    <Button
      variant="outline"
      onClick={signOut}
      className="h-11 gap-2 px-4 text-base font-semibold"
    >
      <SignOut size={18} weight="bold" aria-hidden="true" />
      Изход
    </Button>
  )
}

function DeleteAkaunt({ all }: { all: AkauntProject[] }) {
  const [typed, setTyped] = useState('')
  const [done, setDone] = useState(false)
  const ok = typed.trim().toLocaleUpperCase('bg') === 'ИЗТРИЙ'
  if (done)
    return (
      <p role="status" className="font-semibold">
        (Прототип) Акаунтът е изтрит. Тук истинската страница те пуска към
        началото.
      </p>
    )
  return (
    <div className="border-destructive/40 flex flex-col gap-3 border p-5">
      <h2 className="text-destructive font-semibold">Изтрий Акаунта</h2>
      <p className="text-pretty">
        Изтрива Акаунта и всичко твое в онова за {zaList(all)}. Абонаментите
        спират. Не може да се върне.
      </p>
      <label htmlFor="delete-confirm" className="text-sm font-semibold">
        Напиши ИЗТРИЙ, за да потвърдиш
      </label>
      <Input
        id="delete-confirm"
        autoCapitalize="off"
        spellCheck={false}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        className="h-11 text-base"
      />
      <Button
        variant="destructive"
        disabled={!ok}
        onClick={() => setDone(true)}
        className="h-11 self-start px-4 text-base font-semibold"
      >
        Изтрий Акаунта завинаги
      </Button>
    </div>
  )
}

/* A: tabs on the side, one panel at a time, like Clerk's <UserProfile>. */
function VariantA({ all }: { all: AkauntProject[] }) {
  const tabs = ['Профил', 'Вход', 'Проекти', 'Изтриване'] as const
  const [tab, setTab] = useState<(typeof tabs)[number]>('Профил')
  const panels: Record<(typeof tabs)[number], ReactNode> = {
    Профил: <Identity />,
    Вход: <Methods />,
    Проекти: <ProjectsList all={all} />,
    Изтриване: <DeleteAkaunt all={all} />,
  }
  return (
    <div className="pt-[clamp(2rem,5vw,3.5rem)]">
      <h1 className="font-display text-[clamp(2.5rem,5vw,3.5rem)] leading-none font-extrabold">
        Акаунт
      </h1>
      <div className="border-border mt-10 grid border md:grid-cols-[14rem_minmax(0,1fr)]">
        <nav
          aria-label="Акаунт"
          className="border-border bg-surface flex flex-row flex-wrap gap-1 border-b p-3 md:flex-col md:border-r md:border-b-0"
        >
          {tabs.map((t) => (
            <button
              key={t}
              aria-current={tab === t ? 'page' : undefined}
              onClick={() => setTab(t)}
              className="aria-[current=page]:bg-background px-3 py-2 text-left font-semibold"
            >
              {t}
            </button>
          ))}
          <span className="flex-1" />
          <button
            onClick={signOut}
            className="text-muted-foreground px-3 py-2 text-left font-semibold"
          >
            Изход
          </button>
        </nav>
        <section className="min-h-[22rem] p-6 md:p-8">
          <h2 className={cn(h2, 'mb-6')}>{tab}</h2>
          {panels[tab]}
        </section>
      </div>
    </div>
  )
}

/* B: one page, sections stacked, like /za-men. */
function VariantB({ all }: { all: AkauntProject[] }) {
  return (
    <div className="max-w-[44rem] pt-[clamp(2rem,5vw,3.5rem)]">
      <h1 className="sr-only">Акаунт</h1>
      <div className="flex flex-wrap items-center justify-between gap-6">
        <Identity big />
        <SignOutButton />
      </div>
      <section className="mt-16">
        <h2 className={h2}>Как влизаш</h2>
        <div className="mt-6">
          <Methods />
        </div>
      </section>
      <section className="mt-16">
        <h2 className={h2}>Къде работи</h2>
        <p className="text-muted-foreground mt-3">
          Същият Акаунт, във всеки от тези проекти.
        </p>
        <div className="mt-6">
          <ProjectsList all={all} />
        </div>
      </section>
      <section className="mt-20">
        <DeleteAkaunt all={all} />
      </section>
    </div>
  )
}

/* C: the projects lead, as coloured tiles; the rest is compact below. */
function VariantC({ all }: { all: AkauntProject[] }) {
  return (
    <div className="pt-[clamp(2rem,5vw,3.5rem)]">
      <h1 className="sr-only">Акаунт</h1>
      <div className="border-border flex flex-wrap items-center justify-between gap-6 border-b pb-8">
        <Identity />
        <SignOutButton />
      </div>
      <h2 className={cn(h2, 'mt-12')}>Твоите проекти с този Акаунт</h2>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {all.map((p) => (
          <li key={p.slug} data-accent="" style={accentStyle(p.hue)}>
            <a
              href={p.live ?? '#'}
              className="bg-(--fill) text-(--fill-ink) flex min-h-36 flex-col justify-between p-5"
            >
              <span className="text-sm font-semibold">онова за</span>
              <span className="font-display text-3xl leading-none font-extrabold">
                {p.za}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold">
                Отвори
                <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-3 text-sm">
        Данните си в един проект изтриваш от неговите настройки, в „Данни“.
      </p>
      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className={h2}>Как влизаш</h2>
          <div className="mt-6">
            <Methods />
          </div>
        </section>
        <section className="lg:pt-14">
          <DeleteAkaunt all={all} />
        </section>
      </div>
    </div>
  )
}

export function AkauntPrototype({
  all,
  variant,
}: {
  all: AkauntProject[]
  variant: string
}) {
  return (
    <main id="main" className="shell pb-32">
      {variant === 'A' && <VariantA all={all} />}
      {variant === 'B' && <VariantB all={all} />}
      {variant === 'C' && <VariantC all={all} />}
      <PrototypeBar variants={VARIANTS} />
    </main>
  )
}
