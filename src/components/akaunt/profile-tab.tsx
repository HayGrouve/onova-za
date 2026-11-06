'use client'

import type { UserResource } from '@clerk/nextjs/types'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { errorMessage } from './errors'

const since = new Intl.DateTimeFormat('bg', { month: 'long', year: 'numeric' })

const initials = (user: UserResource) => {
  const source = user.fullName?.trim() || user.primaryEmailAddress?.emailAddress
  if (!source) return '?'
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase('bg'))
    .join('')
}

// One "Име" field, stored the way Clerk keeps it: the first word as the first
// name, the rest as the last name. Both are optional.
const splitName = (value: string) => {
  const [firstName = '', ...rest] = value.trim().split(/\s+/)
  return { firstName, lastName: rest.join(' ') }
}

function Avatar({ user }: { user: UserResource }) {
  if (user.hasImage) {
    return (
      // A Clerk-hosted picture: next/image would need remote config for a
      // 64px avatar.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.imageUrl}
        alt=""
        width={64}
        height={64}
        className="size-16 shrink-0 object-cover"
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="bg-foreground text-background font-display flex size-16 shrink-0 items-center justify-center text-xl font-extrabold"
    >
      {initials(user)}
    </span>
  )
}

export function ProfileTab({ user }: { user: UserResource }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fullName = user.fullName?.trim()

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      await user.update(splitName(name))
      setEditing(false)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-5">
        <Avatar user={user} />
        <div className="min-w-0">
          <p
            data-testid="akaunt-name"
            className="font-display text-2xl leading-tight font-extrabold break-words"
          >
            {fullName || <span className="text-muted-foreground">Без име</span>}
          </p>
          <p className="text-muted-foreground mt-1 break-all">
            {user.primaryEmailAddress?.emailAddress}
          </p>
          {user.createdAt && (
            <p className="text-muted-foreground mt-1 text-sm">
              С Акаунт от {since.format(user.createdAt)}
            </p>
          )}
        </div>
      </div>

      {editing ? (
        <form
          className="flex max-w-md flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <label htmlFor="akaunt-name-input" className="text-sm font-semibold">
            Име
          </label>
          <Input
            id="akaunt-name-input"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'akaunt-name-error' : 'akaunt-name-hint'}
            className="h-11 text-base"
          />
          {error ? (
            <p
              id="akaunt-name-error"
              role="alert"
              className="text-destructive text-sm"
            >
              {error}
            </p>
          ) : (
            <p id="akaunt-name-hint" className="text-muted-foreground text-sm">
              Така те виждат проектите. Може и празно.
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <Button
              type="submit"
              disabled={busy}
              className="h-11 px-4 text-base font-semibold"
            >
              Запази
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(false)
                setError('')
              }}
              className="h-11 px-4 text-base font-semibold"
            >
              Откажи
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          onClick={() => {
            setName(fullName ?? '')
            setEditing(true)
          }}
          className="h-11 self-start px-4 text-base font-semibold"
        >
          {fullName ? 'Промени името' : 'Добави име'}
        </Button>
      )}
    </div>
  )
}
