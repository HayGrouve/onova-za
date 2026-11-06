'use client'

import type { UserResource } from '@clerk/nextjs/types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { paths } from '@/lib/paths'

import { errorMessage, wasCancelled } from './errors'
import { useSensitive } from './reverification'
import type { PanelProject } from './types'

const CONFIRM = 'ИЗТРИЙ'

const list = new Intl.ListFormat('bg', { type: 'conjunction' })

// Изтрий Акаунта: deletes the Clerk user. Each project then removes what it
// holds through its own `user.deleted` webhook (#14, #20), so the copy names
// every project from hub data instead of a hand-typed list.
export function DeleteTab({
  user,
  projects,
  onDeleting,
}: {
  user: UserResource
  projects: PanelProject[]
  onDeleting: (deleting: boolean) => void
}) {
  const router = useRouter()
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const remove = useSensitive(() => user.delete())
  const confirmed = typed.trim().toLocaleUpperCase('bg') === CONFIRM

  const submit = async () => {
    setBusy(true)
    setError('')
    // Without the user Clerk reports "signed out"; the panel must not read
    // that as a reason to send you to Вход.
    onDeleting(true)
    try {
      await remove()
      router.push(paths.home())
    } catch (e) {
      onDeleting(false)
      if (!wasCancelled(e)) setError(errorMessage(e))
      setBusy(false)
    }
  }

  const zas = projects.map((p) => `онова за ${p.za}`)

  return (
    <div className="flex flex-col gap-6">
      {projects.length > 0 && (
        <p className="text-pretty">
          Искаш да махнеш само данните си от един проект? Това става в
          настройките му, в „Данни“. Акаунтът ти остава.
        </p>
      )}
      <form
        aria-labelledby="iztriy-akaunta"
        className="border-destructive/40 flex max-w-xl flex-col gap-3 border p-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (confirmed) void submit()
        }}
      >
        <h3 id="iztriy-akaunta" className="text-destructive font-semibold">
          Изтрий Акаунта
        </h3>
        <p className="text-pretty">
          {projects.length > 0
            ? `Изтрива Акаунта ти и всичко твое в ${list.format(zas)}. Абонаментите спират. Излизаш от всички проекти. Не може да се върне.`
            : 'Изтрива Акаунта ти: името, имейлите и начините, по които влизаш. Излизаш от всички проекти. Не може да се върне.'}
        </p>
        <label htmlFor="delete-confirm" className="text-sm font-semibold">
          Напиши {CONFIRM}, за да потвърдиш
        </label>
        <Input
          id="delete-confirm"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'delete-error' : undefined}
          className="h-11 text-base"
        />
        {error && (
          <p
            id="delete-error"
            role="alert"
            className="text-destructive text-sm"
          >
            {error}
          </p>
        )}
        <Button
          type="submit"
          variant="destructive"
          disabled={!confirmed || busy}
          className="h-11 self-start px-4 text-base font-semibold"
        >
          Изтрий Акаунта завинаги
        </Button>
      </form>
    </div>
  )
}
