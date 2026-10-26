// PROTOTYPE, throwaway (ticket #19): /prototype/vhod?variant=A|B|C&from=<slug>
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { VhodPrototype } from '@/components/prototype/vhod-variants'

import { akauntProjects } from '../akaunt-projects'

export const metadata: Metadata = {
  title: 'Вход (прототип)',
  robots: { index: false },
}

export default function Page() {
  return (
    <Suspense>
      <VhodPrototype all={akauntProjects} />
    </Suspense>
  )
}
