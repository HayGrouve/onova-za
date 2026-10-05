import Image from 'next/image'

import type { Shot } from '@/lib/project-schema'

// A screenshot on a quiet mat: phones stay narrow, browser shots fill.
export function ShotFigure({ shot, sizes }: { shot: Shot; sizes?: string }) {
  const phone = shot.frame === 'phone'
  return (
    <figure className="flex flex-col gap-2">
      <div className="bg-surface flex justify-center px-[clamp(1rem,4vw,2.5rem)] pt-[clamp(1rem,4vw,2.5rem)]">
        <div
          className={
            phone
              ? 'border-line-strong w-full max-w-60 overflow-hidden border border-b-0'
              : 'border-line-strong w-full overflow-hidden border border-b-0'
          }
        >
          <Image
            src={shot.src}
            alt={shot.alt}
            sizes={
              sizes ?? (phone ? '240px' : '(min-width: 1024px) 640px, 92vw')
            }
            className="block h-auto w-full"
          />
        </div>
      </div>
      {shot.caption && (
        <figcaption className="text-muted-foreground text-sm">
          {shot.caption}
        </figcaption>
      )}
    </figure>
  )
}
