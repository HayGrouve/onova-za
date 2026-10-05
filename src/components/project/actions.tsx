import {
  ArrowUpRight,
  DownloadSimple,
  GithubLogo,
} from '@phosphor-icons/react/dist/ssr'

import { buttonVariants } from '@/components/ui/button'
import type { Project } from '@/lib/project-schema'
import { cn } from '@/lib/utils'

const OPEN: Record<Project['type'], string> = {
  app: 'Отвори приложението',
  site: 'Отвори сайта',
  system: 'Отвори системата',
  desktop: 'Отвори',
}

const base = 'h-11 w-full justify-between gap-3 px-4 text-base font-semibold'

// Only links that exist. When a visitor has nothing to open, say why instead
// of showing dead buttons. The code link is for nerd mode only.
export function Actions({ project: p }: { project: Project }) {
  const { live, github, download } = p.links
  const reason = !live && !download && (
    <p
      className="text-muted-foreground"
      data-mode={github ? 'plain' : undefined}
    >
      {noLinkReason(p)}
    </p>
  )
  if (!live && !github && !download) return reason
  return (
    <div className="flex flex-col gap-2">
      {reason}
      {live && (
        <a href={live} className={cn(buttonVariants(), base)}>
          {OPEN[p.type]}
          <ArrowUpRight size={20} weight="bold" aria-hidden="true" />
        </a>
      )}
      {download && (
        <a
          href={download}
          className={cn(
            buttonVariants({ variant: live ? 'outline' : 'default' }),
            base,
          )}
        >
          Изтегли
          <DownloadSimple size={20} weight="bold" aria-hidden="true" />
        </a>
      )}
      {github && (
        <a
          href={github}
          data-mode="nerd"
          className={cn(buttonVariants({ variant: 'outline' }), base)}
        >
          Кодът в GitHub
          <GithubLogo size={20} weight="bold" aria-hidden="true" />
        </a>
      )}
    </div>
  )
}

function noLinkReason(p: Project) {
  if (p.status === 'archived')
    return 'Вече не е онлайн. Тук е, за да се вижда как изглеждаше.'
  if (p.type === 'system')
    return 'Затворена система: вход имат само хората, които я ползват.'
  return 'Още няма публична версия.'
}
