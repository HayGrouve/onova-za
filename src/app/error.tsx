'use client'

import { Button } from '@/components/ui/button'

export default function ErrorPage({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main id="main" className="shell pt-[clamp(2rem,5vw,3.5rem)]">
      <h1 className="font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.95] font-extrabold tracking-[-0.01em]">
        Нещо се счупи.
      </h1>
      <p className="mt-4 max-w-xl text-lg">
        Страницата не се зареди както трябва. Опитай пак след малко.
      </p>
      <Button
        onClick={reset}
        className="mt-8 h-11 px-4 text-base font-semibold"
      >
        Опитай пак
      </Button>
    </main>
  )
}
