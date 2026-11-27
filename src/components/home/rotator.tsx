'use client'

import { Pause, Play } from '@phosphor-icons/react/dist/ssr'
import {
  type CSSProperties,
  type ReactNode,
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import styles from './hero.module.css'

type State = {
  active: number
  count: number
  rendered: (i: number) => boolean
  prepare: (i: number) => void
  show: (i: number) => void
  next: () => void
  playing: boolean
  togglePlaying: () => void
  hover: (on: boolean) => void
}

const RotatorContext = createContext<State | null>(null)

// Every piece below sits inside <Rotator>, so the context is always there.
function useRotator() {
  const state = use(RotatorContext)
  if (!state) throw new Error('Rotator parts must sit inside <Rotator>')
  return state
}

// Holds which project the hero shows. The server HTML is the first one, so
// without JS the hero is simply static. The clock lives in CSS: the active
// control's progress bar is an animation gated by prefers-reduced-motion,
// and when it ends the next project shows. With reduced motion there is no
// animation, so nothing advances on its own; with one project there are no
// controls and no clock at all.
//
// It pauses (and resumes where it was) while the pointer rests on the
// stage, while keyboard focus is on a link or a project control in the hero,
// while the hero is out of the middle of the screen and while the tab is
// hidden. The pause button stops it until pressed again.
export function Rotator({
  hues,
  className,
  children,
}: {
  // One per project, in order: the blank's underline takes the active hue.
  hues: readonly number[]
  className?: string
  children: ReactNode
}) {
  const count = hues.length
  const [active, setActive] = useState(0)
  const [seen, setSeen] = useState<readonly number[]>([0])
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  )
  const [playing, setPlaying] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [onScreen, setOnScreen] = useState(true)
  const tabHidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.hidden,
    () => false,
  )
  const ref = useRef<HTMLDivElement>(null)

  // Whether any of the hero crosses the middle half of the screen. Not a
  // share of its own height: on a landscape phone the hero is taller than
  // the screen and could never be 35% visible.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: '-25% 0px -25% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const prepare = (i: number) =>
    setSeen((list) => (list.includes(i) ? list : [...list, i]))
  const show = (i: number) => {
    prepare(i)
    setActive(i)
  }
  const state: State = {
    active,
    count,
    // A slide's screenshot only enters the page once it is shown or about to
    // be (the next one after hydration, or one you point at or focus). The
    // first visit loads one hero image, not six.
    rendered: (i) =>
      seen.includes(i) || (hydrated && i === (active + 1) % count),
    prepare,
    show,
    next: () => count > 1 && show((active + 1) % count),
    playing,
    togglePlaying: () => setPlaying((on) => !on),
    hover: setHovered,
  }
  const paused = hovered || focused || !onScreen || tabHidden

  return (
    <RotatorContext value={state}>
      <div
        ref={ref}
        className={className}
        data-paused={paused || undefined}
        data-stopped={playing ? undefined : ''}
        style={{ '--blank-h': hues[active] } as CSSProperties}
        // Keyboard focus pauses so a slide never changes under a reader. A
        // click focuses too, so only :focus-visible counts, and never on the
        // pause button: pressing Пусни must start the turn right away.
        onFocus={(e) =>
          setFocused(
            e.target.matches(':focus-visible') &&
              !e.target.hasAttribute('data-rotator-toggle'),
          )
        }
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
        }}
      >
        {children}
      </div>
    </RotatorContext>
  )
}

const noSubscribe = () => () => {}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}

// One word of the blank. All words share one grid cell; data-on shows one.
export function Word({
  index,
  className,
  children,
}: {
  index: number
  className?: string
  children: ReactNode
}) {
  const { active } = useRotator()
  return (
    <span className={className} data-on={index === active || undefined}>
      {children}
    </span>
  )
}

// One slide of the stage. Every slide keeps its box (so the swap can fade
// between them); only the content waits until it is needed.
export function Slide({
  index,
  className,
  children,
}: {
  index: number
  className?: string
  children: ReactNode
}) {
  const { active, rendered } = useRotator()
  return (
    <div className={className} data-on={index === active || undefined}>
      {rendered(index) ? children : null}
    </div>
  )
}

// Only the stage pauses on hover: the hero fills the first screen, so a
// mouse resting anywhere on it would stop the rotation for good, and the
// controls must keep the turn going after a click.
export function PauseOnHover({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const { hover } = useRotator()
  return (
    <div
      className={className}
      onPointerEnter={(e) => e.pointerType === 'mouse' && hover(true)}
      onPointerLeave={() => hover(false)}
    >
      {children}
    </div>
  )
}

export function RotatorControls({
  items,
}: {
  items: readonly { slug: string; za: string }[]
}) {
  const { active, count, prepare, show, next, playing, togglePlaying } =
    useRotator()
  const strip = useRef<HTMLDivElement>(null)

  // On a phone the controls scroll sideways; keep the active one in view.
  // Only the strip scrolls, never the page.
  useEffect(() => {
    const el = strip.current
    const button = el?.children[active] as HTMLElement | undefined
    if (!el || !button || el.scrollWidth <= el.clientWidth) return
    // .controls is positioned, so offsetLeft is measured from the strip.
    const left = button.offsetLeft
    if (
      left < el.scrollLeft ||
      left + button.offsetWidth > el.scrollLeft + el.clientWidth
    ) {
      el.scrollTo({ left: left - 8 })
    }
  }, [active])

  // One project: nothing to pick and nothing to turn.
  if (count < 2) return null

  const label = playing ? 'Спри смяната' : 'Пусни смяната'
  return (
    <div className={styles.controlsBar}>
      <div
        ref={strip}
        className={styles.controls}
        role="group"
        aria-label="Избери екран"
      >
        {items.map((item, i) => (
          <button
            key={item.slug}
            type="button"
            className={styles.control}
            aria-pressed={i === active}
            // Start loading the screenshot before the click lands.
            onPointerEnter={() => prepare(i)}
            onPointerDown={() => prepare(i)}
            onFocus={() => prepare(i)}
            onClick={() => show(i)}
          >
            <span className={styles.controlText} data-text={item.za}>
              <span className="sr-only">Покажи онова за </span>
              {item.za}
            </span>
            <span className={styles.track} aria-hidden="true">
              <span
                className={styles.progress}
                onAnimationEnd={i === active ? next : undefined}
              />
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className={styles.pause}
        data-rotator-toggle=""
        onClick={togglePlaying}
        aria-label={label}
        title={label}
      >
        {playing ? (
          <Pause weight="fill" aria-hidden="true" />
        ) : (
          <Play weight="fill" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
