import { type ReactNode, ViewTransition } from 'react'

// A template remounts on every navigation, so the old page fades out and the
// new one rises in. Header and footer live in the layout and stay put.
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div>{children}</div>
    </ViewTransition>
  )
}
