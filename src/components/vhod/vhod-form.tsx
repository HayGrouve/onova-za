'use client'

import { HandleSSOCallback, useAuth, useSignIn, useSignUp } from '@clerk/nextjs'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { GoogleLogo } from '@phosphor-icons/react'
import type { Route } from 'next'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Suspense,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { paths } from '@/lib/paths'
import { returnTo, type ReturnTo, type VhodProject } from '@/lib/vhod'

// Вход (#47): one column, email first, Google second. Our own form on
// Clerk's hooks, so every word is ours. A new email creates the Акаунт in
// the same step (signUpIfMissing, then a transfer to sign-up).

// Marks the return from Google on Вход itself, so Вход needs no second page.
const SSO_PARAM = 'google'

// `projects` are the ones marked with the Акаунт, from the server.
export function VhodForm({ projects }: { projects: readonly VhodProject[] }) {
  // The query exists only in the browser; the prerendered HTML is the form
  // with nowhere to return, which is what most visits see anyway.
  return (
    <Suspense fallback={<Vhod projects={projects} raw={null} sso={false} />}>
      <LiveVhod projects={projects} />
    </Suspense>
  )
}

function LiveVhod({ projects }: { projects: readonly VhodProject[] }) {
  const params = useSearchParams()
  return (
    <Vhod
      projects={projects}
      raw={params.get('redirect_url')}
      sso={params.get(SSO_PARAM) === '1'}
    />
  )
}

type Step = 'email' | 'code' | 'google' | 'done'

function Vhod({
  projects,
  raw,
  sso,
}: {
  projects: readonly VhodProject[]
  raw: string | null
  sso: boolean
}) {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const { signIn, fetchStatus: signInStatus } = useSignIn()
  const { signUp, fetchStatus: signUpStatus } = useSignUp()

  const target = returnTo(
    raw,
    typeof window === 'undefined' ? 'https://onovaza.com' : location.origin,
    projects,
  )

  const [step, setStep] = useState<Step>(sso ? 'google' : 'email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const leaving = useRef(false)
  const busy = signInStatus === 'fetching' || signUpStatus === 'fetching'

  const go = (href: string) => {
    leaving.current = true
    setStep('done')
    if (/^https?:/.test(href)) window.location.assign(href)
    // returnTo() already refuses `//host`; this keeps it out of the router
    // whatever Clerk's decorateUrl hands back.
    else if (href.startsWith('/') && !/^\/[/\\]/.test(href)) {
      router.replace(href as Route)
    } else router.replace(paths.akaunt())
  }

  // Already signed in: straight on, no form. The return from Google handles
  // its own session below.
  const goOn = useEffectEvent(() => {
    if (!sso && !leaving.current) go(target.href)
  })
  useEffect(() => {
    if (isLoaded && isSignedIn) goOn()
  }, [isLoaded, isSignedIn])

  // Clerk may wrap the URL to refresh its cookie first (Safari).
  const navigate = ({
    decorateUrl,
  }: {
    decorateUrl: (url: string) => string
  }) => go(decorateUrl(target.href))

  const finished = ({ error }: { error: unknown }) => {
    if (!error) return
    leaving.current = false
    setStep((s) => (s === 'done' ? 'code' : s))
    setError(message(error))
  }

  const notReady = () => {
    if (isLoaded) return false
    setError('Входът още зарежда. Опитай пак след малко.')
    return true
  }

  const sendCode = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    if (notReady()) return
    const created = await signIn.create({
      identifier: email.trim(),
      signUpIfMissing: true,
    })
    if (created.error) return setError(message(created.error))
    const sent = await signIn.emailCode.sendCode()
    if (sent.error) return setError(message(sent.error))
    setCode('')
    setStep('code')
  }

  const resend = async () => {
    setError(null)
    setNotice(null)
    if (notReady()) return
    const { error } = await signIn.emailCode.sendCode()
    if (error) return setError(message(error))
    setCode('')
    setNotice('Пратихме ти нов код.')
  }

  const verify = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    if (code.length !== 6) return setError('Кодът е 6 цифри. Виж писмото.')
    if (notReady()) return
    const { error } = await signIn.emailCode.verifyCode({ code })
    if (error) {
      if (codeOf(error) === 'sign_up_if_missing_transfer') return createAkaunt()
      return setError(message(error))
    }
    if (signIn.status === 'complete') {
      leaving.current = true
      return finished(await signIn.finalize({ navigate }))
    }
    setError(GENERIC)
  }

  // The email is new and verified: the same step creates the Акаунт.
  const createAkaunt = async () => {
    const { error } = await signUp.create({ transfer: true })
    if (error) return setError(message(error))
    if (signUp.status === 'complete') {
      leaving.current = true
      return finished(await signUp.finalize({ navigate }))
    }
    // Clerk's bot check (its own modal) was closed or failed. The code is
    // spent by now, so start again from the email.
    if (signUp.missingFields.includes('protect_check')) {
      setStep('email')
      return setError(
        'Не успяхме да потвърдим, че си човек. Прати си нов код и опитай пак.',
      )
    }
    setError(GENERIC)
  }

  const google = async () => {
    setError(null)
    setNotice(null)
    if (notReady()) return
    const { error } = await signIn.sso({
      strategy: 'oauth_google',
      // Back on Вход either way: signed in, it sends you on; with a new
      // Google account, HandleSSOCallback creates the Акаунт first.
      redirectUrl: paths.vhod(raw ?? undefined),
      redirectCallbackUrl: vhodWith(raw, { [SSO_PARAM]: '1' }),
    })
    if (error) setError(message(error))
  }

  const googleFailed = () => {
    if (leaving.current) return
    setStep('email')
    setError('Не успяхме да те вкараме с Google. Опитай пак или влез с имейл.')
    router.replace(paths.vhod(raw ?? undefined))
  }

  const changeEmail = () => {
    setError(null)
    setNotice(null)
    setCode('')
    setStep('email')
  }

  return (
    <div className="mx-auto max-w-[36rem] pt-[clamp(2rem,8vw,6rem)]">
      <p className="text-muted-foreground font-semibold">
        {target.project ? `онова за ${target.project.za}` : 'онова за'}
      </p>
      <h1 className="font-display mt-2 text-[clamp(2.5rem,6vw,4rem)] leading-none font-extrabold">
        Кой си?
      </h1>
      <p className="mt-4 text-lg text-pretty">
        Напиши имейла си и ще ти пратим код. Ако е нов, правим ти Акаунт в
        същата стъпка. Той работи във всички проекти на онова за.
      </p>

      <div className="mt-8">
        {step === 'email' && (
          <EmailStep
            email={email}
            setEmail={setEmail}
            onSubmit={sendCode}
            busy={busy}
            error={error}
          />
        )}
        {step === 'code' && (
          <CodeStep
            email={email.trim()}
            code={code}
            setCode={setCode}
            onSubmit={verify}
            onChangeEmail={changeEmail}
            onResend={resend}
            busy={busy}
            error={error}
            notice={notice}
          />
        )}
        {step === 'google' && (
          <GoogleReturn onFail={googleFailed}>
            <HandleSSOCallback
              navigateToApp={navigate}
              navigateToSignIn={googleFailed}
              navigateToSignUp={googleFailed}
            />
          </GoogleReturn>
        )}
        {step === 'done' && <Done target={target} />}
      </div>

      {step === 'email' && (
        <p className="mt-6">
          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="link-quiet inline-flex items-center gap-2 py-2 font-semibold disabled:opacity-50"
          >
            <GoogleLogo size={18} weight="bold" aria-hidden="true" />
            Или влез с Google
          </button>
        </p>
      )}

      <p className="text-muted-foreground mt-10 text-sm text-pretty">
        Като продължиш, приемаш{' '}
        <Link href={paths.terms()} className="text-foreground link-prose">
          Условията
        </Link>
        . Как пазим данните ти:{' '}
        <Link href={paths.privacy()} className="text-foreground link-prose">
          Поверителност
        </Link>
        .
      </p>
    </div>
  )
}

function EmailStep({
  email,
  setEmail,
  onSubmit,
  busy,
  error,
}: {
  email: string
  setEmail: (email: string) => void
  onSubmit: (e: FormEvent) => void
  busy: boolean
  error: string | null
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <label htmlFor="vhod-email" className="font-semibold">
        Имейл
      </label>
      <Input
        id="vhod-email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        required
        placeholder="ti@primer.bg"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'vhod-error' : undefined}
        className="h-16 px-4 text-xl md:text-xl"
      />
      <ErrorLine error={error} />
      <Button
        type="submit"
        disabled={busy}
        className="h-12 text-base font-semibold"
      >
        Изпрати ми код
      </Button>
      {/* Clerk puts its bot check here when the instance asks for one. */}
      <div id="clerk-captcha" />
    </form>
  )
}

function CodeStep({
  email,
  code,
  setCode,
  onSubmit,
  onChangeEmail,
  onResend,
  busy,
  error,
  notice,
}: {
  email: string
  code: string
  setCode: (code: string) => void
  onSubmit: (e: FormEvent) => void
  onChangeEmail: () => void
  onResend: () => void
  busy: boolean
  error: string | null
  notice: string | null
}) {
  const input = useRef<HTMLInputElement>(null)
  // The code field replaces the email field, so focus moves with it.
  useEffect(() => input.current?.focus(), [])

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <p className="text-lg text-pretty">
        Пратихме 6 цифри на{' '}
        <strong className="[overflow-wrap:anywhere]">{email}</strong>.
      </p>
      <p className="text-muted-foreground text-pretty">
        Писмото е на английски, от онова за. Кодът важи 10 минути.
      </p>
      <label htmlFor="vhod-code" className="mt-2 font-semibold">
        Код
      </label>
      <Input
        ref={input}
        id="vhod-code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'vhod-error' : undefined}
        className="h-14 text-center font-mono text-2xl tracking-[0.5em] md:text-2xl"
      />
      <ErrorLine error={error} />
      <Button
        type="submit"
        disabled={busy}
        className="h-12 text-base font-semibold"
      >
        Влез
      </Button>
      <div className="flex justify-between gap-4 text-sm font-semibold">
        <button
          type="button"
          className="link-quiet py-2"
          onClick={onChangeEmail}
        >
          Друг имейл
        </button>
        <button
          type="button"
          className="link-quiet py-2 disabled:opacity-50"
          onClick={onResend}
          disabled={busy}
        >
          Прати нов код
        </button>
      </div>
      <p role="status" className="text-sm empty:hidden">
        {notice}
      </p>
    </form>
  )
}

function ErrorLine({ error }: { error: string | null }) {
  return (
    <p
      id="vhod-error"
      role="alert"
      className="text-destructive font-semibold empty:hidden"
    >
      {error}
    </p>
  )
}

// Back from Google. Clerk finishes the sign-in, or creates the Акаунт when
// the Google account is new; if nothing happens (you cancelled at Google),
// the form comes back with an error.
function GoogleReturn({
  onFail,
  children,
}: {
  onFail: () => void
  children: ReactNode
}) {
  const failed = useRef(onFail)
  useEffect(() => {
    failed.current = onFail
  })
  useEffect(() => {
    const timer = setTimeout(() => failed.current(), 15_000)
    return () => clearTimeout(timer)
  }, [])
  return (
    <>
      <p role="status" className="text-lg font-semibold">
        Влизаш с Google…
      </p>
      {children}
    </>
  )
}

function Done({ target }: { target: ReturnTo }) {
  const where = target.project
    ? `Връщаме те в онова за ${target.project.za}…`
    : target.fallback
      ? 'Отваряме Акаунта ти…'
      : 'Връщаме те обратно…'
  return (
    <p role="status" className="text-lg font-semibold">
      Готово. {where}
    </p>
  )
}

const GENERIC = 'Нещо се обърка. Опитай пак след малко.'

// Clerk's own messages are English and formal, so Вход says its own.
const MESSAGES: Record<string, string> = {
  form_code_incorrect: 'Кодът не е верен. Провери писмото и опитай пак.',
  verification_expired: 'Кодът изтече. Прати си нов.',
  verification_failed: 'Твърде много грешни опита. Прати си нов код.',
  form_param_format_invalid: 'Това не прилича на имейл. Провери го.',
  form_param_missing: 'Напиши имейла си.',
  form_identifier_not_found: 'Това не прилича на имейл. Провери го.',
  too_many_requests: 'Твърде много опита. Изчакай малко и пак.',
  user_locked:
    'Входът е спрян за малко след много грешни опита. Пробвай пак след час.',
  oauth_access_denied: 'Отказа достъпа в Google. Опитай пак или влез с имейл.',
}

function codeOf(error: unknown): string | undefined {
  if (isClerkAPIResponseError(error)) return error.errors[0]?.code
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code)
  }
  return undefined
}

function message(error: unknown): string {
  const code = codeOf(error)
  return (code && MESSAGES[code]) || GENERIC
}

// Вход's own URL with the same redirect_url and extra query.
function vhodWith(raw: string | null, extra: Record<string, string>) {
  const query = new URLSearchParams(extra)
  if (raw) query.set('redirect_url', raw)
  return `${paths.vhod()}?${query}`
}
