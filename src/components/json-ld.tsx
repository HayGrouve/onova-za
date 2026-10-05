import type { Graph } from 'schema-dts'

// JSON-LD as a plain script tag. `<` is escaped so content can never close
// the script element early.
export function JsonLd({ data }: { data: Graph }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
