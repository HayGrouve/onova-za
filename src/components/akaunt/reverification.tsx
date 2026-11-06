'use client'

import { useReverification, useSession } from '@clerk/nextjs'
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import { errorMessage } from './errors'

type Level = 'first_factor' | 'second_factor' | 'multi_factor'

type Request = {
  complete: () => void
  cancel: () => void
  level: Level | undefined
}

const RequestContext = createContext<(request: Request) => void>(() => {})

// Sensitive actions (adding or removing a way in, deleting the Акаунт) can
// answer "verify again first" when the last Вход is too old. Clerk's default
// for that is its own English modal; this one is ours: a fresh code to the
// person's email, then the action retries by itself.
export function ReverificationProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null)
  return (
    <RequestContext.Provider value={setRequest}>
      {children}
      {request && (
        <ReverifyDialog request={request} onClose={() => setRequest(null)} />
      )}
    </RequestContext.Provider>
  )
}

// Wraps a Clerk call so that, if it needs reverification, the dialog opens
// and the call runs again once the code is right. Closing the dialog rejects
// with a cancellation (see `wasCancelled`).
export function useSensitive<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
) {
  const request = useContext(RequestContext)
  return useReverification(action, { onNeedsReverification: request })
}

type Step =
  | { kind: 'sending' }
  | { kind: 'code'; email: string }
  | { kind: 'failed'; message: string }

function ReverifyDialog({
  request,
  onClose,
}: {
  request: Request
  onClose: () => void
}) {
  const { session } = useSession()
  const [step, setStep] = useState<Step>({ kind: 'sending' })
  const [emailAddressId, setEmailAddressId] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Development renders effects twice; one code is enough.
  const started = useRef(false)

  useEffect(() => {
    if (!session || started.current) return
    started.current = true
    ;(async () => {
      try {
        const verification = await session.startVerification({
          level: request.level ?? 'first_factor',
        })
        const factor = verification.supportedFirstFactors?.find(
          (f) => f.strategy === 'email_code',
        )
        if (!factor || factor.strategy !== 'email_code') {
          setStep({
            kind: 'failed',
            message:
              'Не можем да ти пратим код. Излез, влез пак и опитай отново.',
          })
          return
        }
        await session.prepareFirstFactorVerification({
          strategy: 'email_code',
          emailAddressId: factor.emailAddressId,
        })
        setEmailAddressId(factor.emailAddressId)
        setStep({ kind: 'code', email: factor.safeIdentifier })
      } catch (e) {
        setStep({ kind: 'failed', message: errorMessage(e) })
      }
    })()
  }, [session, request.level])

  const cancel = () => {
    request.cancel()
    onClose()
  }

  const submit = async () => {
    if (!session) return
    setBusy(true)
    setError('')
    try {
      const result = await session.attemptFirstFactorVerification({
        strategy: 'email_code',
        code: code.trim(),
      })
      if (result.status === 'complete') {
        request.complete()
        onClose()
        return
      }
      // A second factor would be next, but the Акаунт has none to offer.
      setStep({
        kind: 'failed',
        message: 'Не можем да те потвърдим така. Излез, влез пак и опитай.',
      })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (!session || !emailAddressId) return
    setError('')
    setCode('')
    try {
      await session.prepareFirstFactorVerification({
        strategy: 'email_code',
        emailAddressId,
      })
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && cancel()}>
      <DialogContent showCloseButton={false} className="gap-5 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl leading-none font-extrabold">
            Потвърди, че си ти
          </DialogTitle>
          <DialogDescription className="text-foreground text-base">
            {step.kind === 'sending' && 'Пращаме ти код по имейла.'}
            {step.kind === 'code' &&
              `За тази промяна ти трябва нов код. Пратихме го на ${step.email}.`}
            {step.kind === 'failed' && step.message}
          </DialogDescription>
        </DialogHeader>
        {step.kind === 'code' && (
          <form
            id="reverify"
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            <label htmlFor="reverify-code" className="text-sm font-semibold">
              Код от имейла
            </label>
            <Input
              id="reverify-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'reverify-error' : undefined}
              className="h-11 text-lg tracking-[0.3em]"
            />
            {error && (
              <p
                id="reverify-error"
                role="alert"
                className="text-destructive text-sm"
              >
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={() => void resend()}
              className="link-prose self-start text-sm"
            >
              Прати нов код
            </button>
          </form>
        )}
        <DialogFooter className="mx-0 mb-0 border-0 bg-transparent p-0">
          <Button
            variant="outline"
            onClick={cancel}
            className="h-11 px-4 text-base font-semibold"
          >
            Откажи
          </Button>
          {step.kind === 'code' && (
            <Button
              type="submit"
              form="reverify"
              disabled={busy || code.trim().length === 0}
              className="h-11 px-4 text-base font-semibold"
            >
              Потвърди
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
