'use client'

import type { EmailAddressResource, UserResource } from '@clerk/nextjs/types'
import { EnvelopeSimple, GoogleLogo } from '@phosphor-icons/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { errorMessage, wasCancelled } from './errors'
import { useSensitive } from './reverification'

const rowButton = 'h-10 shrink-0 px-3 text-base font-semibold'

type Adding =
  | { kind: 'closed' }
  | { kind: 'email' }
  | { kind: 'code'; address: EmailAddressResource }

// Вход: the ways into the Акаунт. Google on or off, and the emails a code can
// go to. Adding, removing and switching are sensitive, so each may ask for a
// fresh code first (see ReverificationProvider).
export function VhodTab({ user }: { user: UserResource }) {
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (action: () => Promise<string | void>) => {
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const done = await action()
      await user.reload()
      if (done) setStatus(done)
    } catch (e) {
      if (!wasCancelled(e)) setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const destroy = useSensitive((resource: { destroy: () => Promise<void> }) =>
    resource.destroy(),
  )
  const makePrimary = useSensitive((id: string) =>
    user.update({ primaryEmailAddressId: id }),
  )
  const connectGoogle = useSensitive(() =>
    user.createExternalAccount({
      strategy: 'oauth_google',
      redirectUrl: window.location.href,
    }),
  )

  const google = user.externalAccounts.find((a) => a.provider === 'google')
  const googleConnected = google?.verification?.status === 'verified'
  const primaryId = user.primaryEmailAddressId
  // The primary first, then confirmed, then any still waiting for a code.
  const rank = (a: EmailAddressResource) =>
    a.id === primaryId ? 0 : a.verification.status === 'verified' ? 1 : 2
  const emails = [...user.emailAddresses].sort((a, b) => rank(a) - rank(b))

  return (
    <div className="flex flex-col gap-8">
      <p className="text-pretty">
        Влизаш с Google или с код по имейл. И двата пътя водят до същия Акаунт.
      </p>

      <section aria-labelledby="vhod-google">
        <div className="border-border flex flex-wrap items-center gap-x-4 gap-y-2 border-y py-4">
          <GoogleLogo size={22} weight="bold" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 id="vhod-google" className="font-semibold">
              Google
            </h3>
            <p className="text-muted-foreground text-sm break-all">
              {!google && 'Не е свързан'}
              {google && googleConnected && google.emailAddress}
              {google && !googleConnected && 'Връзката не завърши.'}
            </p>
          </div>
          {google ? (
            <Button
              variant="ghost"
              disabled={busy}
              aria-label="Махни Google"
              onClick={() =>
                run(async () => {
                  await destroy(google)
                  return 'Махнахме Google. Влизаш с код по имейл.'
                })
              }
              className={rowButton}
            >
              Махни
            </Button>
          ) : (
            <Button
              variant="ghost"
              disabled={busy}
              aria-label="Свържи Google"
              onClick={() =>
                run(async () => {
                  const account = await connectGoogle()
                  const to =
                    account.verification?.externalVerificationRedirectURL
                  if (to) window.location.assign(to.href)
                })
              }
              className={rowButton}
            >
              Свържи
            </Button>
          )}
        </div>
      </section>

      <section aria-labelledby="vhod-email">
        <div className="flex items-center gap-4">
          <EnvelopeSimple size={22} weight="bold" aria-hidden="true" />
          <h3 id="vhod-email" className="font-semibold">
            Код по имейл
          </h3>
        </div>
        <ul className="divide-border border-border mt-3 divide-y border-y">
          {emails.map((address) => {
            // destroy() clears the resource, so keep the string.
            const email = address.emailAddress
            const primary = address.id === primaryId
            const verified = address.verification.status === 'verified'
            return (
              <li
                key={address.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3"
              >
                <p className="min-w-0 flex-1 break-all">
                  {address.emailAddress}
                  {primary && (
                    <span className="text-muted-foreground"> (основен)</span>
                  )}
                  {!verified && (
                    <span className="text-muted-foreground">
                      {' '}
                      (не е потвърден)
                    </span>
                  )}
                </p>
                {!primary && (
                  <div className="flex gap-1">
                    {verified && (
                      <Button
                        variant="ghost"
                        disabled={busy}
                        aria-label={`Направи ${address.emailAddress} основен`}
                        onClick={() =>
                          run(async () => {
                            await makePrimary(address.id)
                            return `Основният ти имейл вече е ${email}.`
                          })
                        }
                        className={rowButton}
                      >
                        Направи основен
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      disabled={busy}
                      aria-label={`Махни ${address.emailAddress}`}
                      onClick={() =>
                        run(async () => {
                          await destroy(address)
                          return `Махнахме ${email}.`
                        })
                      }
                      className={rowButton}
                    >
                      Махни
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        <AddEmail
          user={user}
          onAdded={(email) => {
            setError('')
            setStatus(`Добавихме ${email}.`)
          }}
        />
      </section>

      <div aria-live="polite" className="empty:hidden">
        {status && <p className="font-semibold">{status}</p>}
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function AddEmail({
  user,
  onAdded,
}: {
  user: UserResource
  onAdded: (email: string) => void
}) {
  const [adding, setAdding] = useState<Adding>({ kind: 'closed' })
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const create = useSensitive((value: string) =>
    user.createEmailAddress({ email: value }),
  )

  const step = async (action: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (e) {
      if (!wasCancelled(e)) setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const close = () => {
    setAdding({ kind: 'closed' })
    setEmail('')
    setCode('')
    setError('')
  }

  if (adding.kind === 'closed') {
    return (
      <Button
        variant="outline"
        onClick={() => setAdding({ kind: 'email' })}
        className="mt-4 h-11 px-4 text-base font-semibold"
      >
        Добави имейл
      </Button>
    )
  }

  const errorId = 'add-email-error'
  const errorLine = error && (
    <p id={errorId} role="alert" className="text-destructive text-sm">
      {error}
    </p>
  )

  if (adding.kind === 'email') {
    return (
      <form
        className="mt-4 flex max-w-md flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void step(async () => {
            const address = await create(email.trim())
            await address.prepareVerification({ strategy: 'email_code' })
            setAdding({ kind: 'code', address })
          })
        }}
      >
        <label htmlFor="add-email" className="text-sm font-semibold">
          Нов имейл
        </label>
        <Input
          id="add-email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-11 text-base"
        />
        {errorLine}
        <div className="mt-2 flex gap-2">
          <Button
            type="submit"
            disabled={busy}
            className="h-11 px-4 text-base font-semibold"
          >
            Прати код
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={close}
            className="h-11 px-4 text-base font-semibold"
          >
            Откажи
          </Button>
        </div>
      </form>
    )
  }

  const { address } = adding
  return (
    <form
      className="mt-4 flex max-w-md flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        void step(async () => {
          const verified = await address.attemptVerification({
            code: code.trim(),
          })
          if (verified.verification.status !== 'verified') {
            setError('Кодът не е верен. Провери го и опитай пак.')
            return
          }
          await user.reload()
          close()
          onAdded(verified.emailAddress)
        })
      }}
    >
      <p className="text-pretty">
        Пратихме код на <strong>{address.emailAddress}</strong>.
      </p>
      <label htmlFor="add-email-code" className="text-sm font-semibold">
        Код от имейла
      </label>
      <Input
        id="add-email-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-11 text-lg tracking-[0.3em]"
      />
      {errorLine}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={busy || code.trim().length === 0}
          className="h-11 px-4 text-base font-semibold"
        >
          Потвърди
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() =>
            step(async () => {
              setCode('')
              await address.prepareVerification({ strategy: 'email_code' })
            })
          }
          className="h-11 px-4 text-base font-semibold"
        >
          Прати нов код
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() =>
            step(async () => {
              // The half-added address would sit in the list unconfirmed.
              await address.destroy().catch(() => {})
              await user.reload()
              close()
            })
          }
          className="h-11 px-4 text-base font-semibold"
        >
          Откажи
        </Button>
      </div>
    </form>
  )
}
