import type { Metadata } from 'next'

// Throwaway homepage prototypes. Never indexed, removed after the decision.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ConceptsLayout({ children }: LayoutProps<'/'>) {
  return children
}
