'use client'

// PROTOTYPE, throwaway (ticket #19): three looks for the hub's Вход page.
// No Clerk: Google and the email code are stubs that "sign in" by setting
// the prototype cookie, then return you like the real redirect_url would.

import { GoogleLogo } from '@phosphor-icons/react'
import type { Route } from 'next'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, type CSSProperties, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { PrototypeBar, setSignedIn } from './prototype-bar'

export type ProtoProject = {
  slug: string
  za: string
  hue: number
  name: string
}

const VARIANTS = [
  { key: 'A', name: 'Карта' },
  { key: 'B', name: 'Две колони' },
  { key: 'C', name: 'Имейлът отпред' },
]

function useVhod() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'start' | 'code' | 'done'>('start')
  // Same-origin paths only. The real page relies on Clerk's own check of
  // redirect_url against the allowed origins (*.onovaza.com).
  const raw = params.get('redirect_url')
  const back =
    raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\')
      ? raw
      : '/prototype/akaunt'
  const finish = () => {
    setStep('done')
    setSignedIn(true)
    setTimeout(() => router.push(back as Route), 900)
  }
  return {
    email,
    setEmail,
    code,
    setCode,
    step,
    google: finish,
    sendCode: (e: FormEvent) => {
      e.preventDefault()
      if (email.includes('@')) setStep('code')
    },
    verify: (e: FormEvent) => {
      e.preventDefault()
      if (code.length === 6) finish()
    },
    restart: () => {
      setCode('')
      setStep('start')
    },
  }
}

type Flow = ReturnType<typeof useVhod>

const accentStyle = (p?: ProtoProject) =>
  (p ? { '--h': p.hue } : undefined) as CSSProperties | undefined

function Consent({ className }: { className?: string }) {
  return (
    <p className={cn('text-muted-foreground text-sm text-pretty', className)}>
      Като продължиш, приемаш{' '}
      <a href="#uslovia" className="text-foreground underline">
        Условията
      </a>{' '}
      и{' '}
      <a href="#poveritelnost" className="text-foreground underline">
        Поверителността
      </a>
      .
    </p>
  )
}

function GoogleButton({ flow, className }: { flow: Flow; className?: string }) {
  return (
    <Button
      variant="outline"
      onClick={flow.google}
      className={cn('h-12 w-full gap-3 text-base font-semibold', className)}
    >
      <GoogleLogo size={20} weight="bold" aria-hidden="true" />
      Продължи с Google
    </Button>
  )
}

function EmailStep({ flow, big }: { flow: Flow; big?: boolean }) {
  return (
    <form onSubmit={flow.sendCode} className="flex flex-col gap-3">
      <label htmlFor="email" className="font-semibold">
        Имейл
      </label>
      <Input
        id="email"
        type="email"
        autoComplete="email"
        placeholder="ti@primer.bg"
        value={flow.email}
        onChange={(e) => flow.setEmail(e.target.value)}
        className={cn('h-12 text-base', big && 'h-16 text-xl')}
      />
      <Button type="submit" className="h-12 text-base font-semibold">
        Изпрати ми код
      </Button>
    </form>
  )
}

function CodeStep({ flow }: { flow: Flow }) {
  return (
    <form onSubmit={flow.verify} className="flex flex-col gap-3">
      <p className="text-pretty">
        Пратихме 6 цифри на <strong>{flow.email}</strong>. Кодът важи 10
        минути.
      </p>
      <label htmlFor="code" className="font-semibold">
        Код
      </label>
      <Input
        id="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={flow.code}
        onChange={(e) => flow.setCode(e.target.value.replace(/\D/g, ''))}
        className="h-14 text-center font-mono text-2xl tracking-[0.5em]"
      />
      <Button type="submit" className="h-12 text-base font-semibold">
        Влез
      </Button>
      <div className="flex justify-between text-sm font-semibold">
        <button type="button" className="link-quiet" onClick={flow.restart}>
          Друг имейл
        </button>
        <button type="button" className="link-quiet">
          Прати нов код
        </button>
      </div>
    </form>
  )
}

function Done({ project }: { project?: ProtoProject }) {
  return (
    <p className="text-lg font-semibold" role="status">
      Готово. Връщаме те {project ? `в онова за ${project.za}` : 'обратно'}…
    </p>
  )
}

function Steps({ flow, project, big }: { flow: Flow; project?: ProtoProject; big?: boolean }) {
  if (flow.step === 'done') return <Done project={project} />
  if (flow.step === 'code') return <CodeStep flow={flow} />
  return <EmailStep flow={flow} big={big} />
}

function Or() {
  return (
    <div className="text-muted-foreground flex items-center gap-3 text-sm">
      <span className="bg-border h-px flex-1" />
      или
      <span className="bg-border h-px flex-1" />
    </div>
  )
}

/* A: a narrow card, close to what a themed Clerk <SignIn> would give. */
function VariantA({ flow, project }: { flow: Flow; project?: ProtoProject }) {
  return (
    <div className="flex justify-center pt-[clamp(2rem,8vw,5rem)]">
      <div className="border-border bg-card w-full max-w-[26rem] border p-8">
        {project && (
          <p
            data-accent=""
            style={accentStyle(project)}
            className="bg-(--fill) text-(--fill-ink) mb-6 inline-block px-2 py-1 text-sm font-semibold"
          >
            онова за {project.za}
          </p>
        )}
        <h1 className="font-display text-4xl leading-none font-extrabold">
          Вход
        </h1>
        <p className="text-muted-foreground mt-3 text-pretty">
          {project
            ? `Влизаш в онова за ${project.za}. Същият Акаунт работи във всички проекти.`
            : 'Един Акаунт за всички проекти на онова за.'}
        </p>
        <div className="mt-8 flex flex-col gap-5">
          {flow.step === 'start' && (
            <>
              <GoogleButton flow={flow} />
              <Or />
            </>
          )}
          <Steps flow={flow} project={project} />
        </div>
        <Consent className="mt-8" />
      </div>
    </div>
  )
}

/* B: editorial, like the hub's own pages: the big type names where you go. */
function VariantB({
  flow,
  project,
  all,
}: {
  flow: Flow
  project?: ProtoProject
  all: ProtoProject[]
}) {
  return (
    <div className="grid gap-14 pt-[clamp(2rem,5vw,3.5rem)] lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-20">
      <div>
        <h1 className="font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] font-extrabold tracking-[-0.01em]">
          {project ? (
            <>
              Влизаш в онова за{' '}
              <span
                data-accent=""
                style={accentStyle(project)}
                className="text-(--tint)"
              >
                {project.za}
              </span>
            </>
          ) : (
            'Вход'
          )}
        </h1>
        <p className="mt-6 max-w-[34rem] text-xl leading-snug text-pretty">
          Един Акаунт за всичко на онова за. С него влизаш и в:
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {all
            .filter((p) => p.slug !== project?.slug)
            .map((p) => (
              <li
                key={p.slug}
                data-accent=""
                style={accentStyle(p)}
                className="border-border border px-3 py-1.5 font-semibold"
              >
                <span className="bg-(--fill) mr-2 inline-block size-2.5" />
                {p.za}
              </li>
            ))}
        </ul>
      </div>
      <div className="flex flex-col gap-5 lg:pt-4">
        {flow.step === 'start' && (
          <>
            <GoogleButton flow={flow} />
            <Or />
          </>
        )}
        <Steps flow={flow} project={project} />
        <Consent />
      </div>
    </div>
  )
}

/* C: one big email field first; Google is the quieter second way. */
function VariantC({ flow, project }: { flow: Flow; project?: ProtoProject }) {
  return (
    <div className="mx-auto max-w-[36rem] pt-[clamp(2rem,8vw,6rem)]">
      <p className="text-muted-foreground font-semibold">
        {project ? `онова за ${project.za}` : 'онова за'}
      </p>
      <h1 className="font-display mt-2 text-[clamp(2.5rem,6vw,4rem)] leading-none font-extrabold">
        Кой си?
      </h1>
      <p className="mt-4 text-lg text-pretty">
        Напиши имейла си и ще ти пратим код. Ако е нов, правим ти Акаунт в
        същата стъпка. Той работи във всички проекти на онова за.
      </p>
      <div className="mt-8">
        <Steps flow={flow} project={project} big />
      </div>
      {flow.step === 'start' && (
        <p className="mt-6">
          <button
            type="button"
            onClick={flow.google}
            className="link-quiet inline-flex items-center gap-2 font-semibold"
          >
            <GoogleLogo size={18} weight="bold" aria-hidden="true" />
            Или влез с Google
          </button>
        </p>
      )}
      <Consent className="mt-10" />
    </div>
  )
}

export function VhodPrototype({ all }: { all: ProtoProject[] }) {
  const params = useSearchParams()
  const flow = useVhod()
  const variant = params.get('variant') ?? 'A'
  const project = all.find((p) => p.slug === params.get('from'))
  return (
    <main id="main" className="shell pb-32">
      {variant === 'A' && <VariantA flow={flow} project={project} />}
      {variant === 'B' && <VariantB flow={flow} project={project} all={all} />}
      {variant === 'C' && <VariantC flow={flow} project={project} />}
      <p className="text-muted-foreground mt-16 text-center text-xs">
        Прототип. <Link href={'/prototype/akaunt' as Route}>/akaunt</Link>
      </p>
      <PrototypeBar
        variants={VARIANTS}
        extra={{
          param: 'from',
          label: 'from',
          options: [
            { value: '', label: 'hub' },
            ...all.map((p) => ({ value: p.slug, label: p.za })),
          ],
        }}
      />
    </main>
  )
}
