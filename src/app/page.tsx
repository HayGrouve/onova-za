import { projects } from '@/lib/projects'

export default function Home() {
  return (
    <main id="main">
      <ul>
        {projects.map((p) => (
          <li key={p.slug}>онова за {p.za}</li>
        ))}
      </ul>
    </main>
  )
}
