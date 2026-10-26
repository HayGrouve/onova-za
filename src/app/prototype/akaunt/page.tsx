// PROTOTYPE, throwaway (ticket #19): /prototype/akaunt?variant=A|B|C
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AkauntPrototype } from '@/components/prototype/akaunt-variants'

import { akauntProjects } from '../akaunt-projects'

export const metadata: Metadata = {
  title: 'Акаунт (прототип)',
  robots: { index: false },
}

export default async function Page({
  searchParams,
}: PageProps<'/prototype/akaunt'>) {
  const { variant } = await searchParams
  return (
    <Suspense>
      <AkauntPrototype
        all={akauntProjects}
        variant={typeof variant === 'string' ? variant : 'A'}
      />
    </Suspense>
  )
}
