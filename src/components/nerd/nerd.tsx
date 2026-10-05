'use client'

import { Eyeglasses } from '@phosphor-icons/react'
import { useId, useSyncExternalStore } from 'react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import { NERD_KEY } from './nerd-script'

const CHANGE = 'onova-nerd-change'

function subscribe(onChange: () => void) {
  // Another tab flipped it: follow along.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== NERD_KEY) return
    document.documentElement.toggleAttribute('data-nerd', e.newValue === '1')
    onChange()
  }
  window.addEventListener(CHANGE, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

const isNerd = () => document.documentElement.hasAttribute('data-nerd')

export function useNerd() {
  return useSyncExternalStore(subscribe, isNerd, () => false)
}

export function setNerd(on: boolean) {
  const apply = () => {
    document.documentElement.toggleAttribute('data-nerd', on)
    try {
      localStorage.setItem(NERD_KEY, on ? '1' : '0')
    } catch {
      // Private mode: the switch still works for this page view.
    }
    window.dispatchEvent(new Event(CHANGE))
  }
  // A short crossfade so sections appearing and disappearing read as one
  // change. Reduced motion zeroes its duration in globals.css.
  if (document.startViewTransition) document.startViewTransition(apply)
  else apply()
}

export function NerdSwitch() {
  const id = useId()
  const nerd = useNerd()
  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor={id}
        className="cursor-pointer gap-1.5 text-base font-semibold"
      >
        <Eyeglasses size={22} weight="bold" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Нърд режим</span>
      </Label>
      <Switch
        id={id}
        checked={nerd}
        onCheckedChange={setNerd}
        aria-describedby={`${id}-hint`}
      />
      <span id={`${id}-hint`} className="sr-only">
        Показва технологиите, кода и работата ми.
      </span>
    </div>
  )
}

// In-text way in, shown in plain mode where the nerd details would be.
export function NerdOnButton({ children }: { children: string }) {
  return (
    <button
      type="button"
      onClick={() => setNerd(true)}
      className="link-prose cursor-pointer font-semibold"
    >
      {children}
    </button>
  )
}
