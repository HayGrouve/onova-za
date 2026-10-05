import Link from 'next/link'
import type { ReactNode } from 'react'

// Renders one line of project copy with **bold**, `code` and [text](url).
// Kept tiny on purpose: project text is structured fields, not documents.
const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g

export function Inline({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter(Boolean)
  return parts.map((part, i) => renderPart(part, i))
}

function renderPart(part: string, key: number): ReactNode {
  if (part.startsWith('**') && part.endsWith('**')) {
    return (
      <strong key={key} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    )
  }
  if (part.startsWith('`') && part.endsWith('`')) {
    return (
      <code key={key} className="bg-surface px-1 py-0.5 font-mono text-[0.9em]">
        {part.slice(1, -1)}
      </code>
    )
  }
  const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
  if (link) {
    const [, label, href] = link
    const className =
      'underline decoration-line-strong underline-offset-4 hover:decoration-foreground'
    return href.startsWith('/') ? (
      <Link key={key} href={href as never} className={className}>
        {label}
      </Link>
    ) : (
      <a key={key} href={href} className={className}>
        {label}
      </a>
    )
  }
  return part
}
