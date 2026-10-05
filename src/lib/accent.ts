import type { CSSProperties } from 'react'

// Spread on any element that should take a project's colour:
// <div {...accent(p.hue)}>. globals.css recomputes --fill and --tint there.
export const accent = (hue: number) => ({
  'data-accent': '',
  style: { '--h': hue } as CSSProperties,
})
