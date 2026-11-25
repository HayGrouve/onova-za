import type { Metadata } from 'next'
import Link from 'next/link'

import { JsonLd } from '@/components/json-ld'
import {
  ChangeList,
  ControllerEmail as Email,
  LegalPage,
  type LegalSection,
} from '@/components/legal/legal-page'
import { klientiteTerms } from '@/content/legal/klientite'
import { kuhnyataTerms } from '@/content/legal/kuhnyata'
import { smetkataTerms } from '@/content/legal/smetkata'
import { controller, effectiveDate, termsChanges } from '@/lib/legal'
import { paths } from '@/lib/paths'
import { legalPageGraph, pageMeta } from '@/lib/seo'

const title = 'Условия'

export const metadata: Metadata = pageMeta({
  path: paths.terms(),
  title: 'Условия за Акаунта и onovaza.com',
  description:
    'Правилата за Акаунта на онова за: кой може да го ползва, какво не се прави, как се изтрива и как те уведомявам за промени.',
})

const PrivacyLink = ({ hash = '' }: { hash?: string }) => (
  <Link href={`${paths.privacy()}${hash}` as never}>Поверителност</Link>
)

const sections: LegalSection[] = [
  {
    id: 'koy-sam-az',
    title: 'Кой съм аз',
    body: (
      <p>
        Акаунтът и onovaza.com са мои: {controller.name}, физическо лице. Пиши
        ми на <Email />. Пълните ми данни за връзка са в{' '}
        <PrivacyLink hash="#koy-sam-az" />.
      </p>
    ),
  },
  {
    id: 'kakvo-e-akauntat',
    title: 'Какво е Акаунтът',
    body: (
      <>
        <p>
          Акаунтът е една самоличност за всички проекти на онова за. Влизаш на
          onovaza.com/vhod с имейл и код или с Google. Ако имейлът е нов,
          Акаунтът се създава в същата стъпка. Акаунтът е безплатен.
        </p>
        <p>
          Всеки проект пази своите данни отделно. Ако някой проект има свои
          правила или платен план, те са в неговия раздел по-долу и важат само
          за него. Как пазя данните ти пише в <PrivacyLink />.
        </p>
      </>
    ),
  },
  {
    id: 'kak-go-polzvash',
    title: 'Как го ползваш',
    body: (
      <>
        <ul>
          <li>Трябва да си на 18 или повече години.</li>
          <li>Един Акаунт е за един човек. Не го давай на други.</li>
          <li>
            Ползвай имейл, който е твой и до който имаш достъп: там идва кодът
            за вход.
          </li>
        </ul>
        <p>Не ползвай Акаунта и проектите, за да:</p>
        <ul>
          <li>качваш незаконно или обидно съдържание;</li>
          <li>влизаш в чужди Акаунти или данни;</li>
          <li>заобикаляш защитите и ограниченията;</li>
          <li>натоварваш услугите с автоматизирани заявки.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'bezplatno',
    title: 'Безплатно и както е',
    body: (
      <>
        <p>
          Акаунтът и onovaza.com са безплатни и ги правя сам. Стремя се да
          работят надеждно, но не обещавам, че ще са винаги достъпни или без
          грешки. Мога да променям или спирам функции. Ако спра цял проект, ще
          те предупредя предварително, за да изтеглиш данните си.
        </p>
        <p>
          Отговарям за вредите, които съм причинил умишлено или при груба
          небрежност, и във всички други случаи, в които законът не позволява
          отговорността да се ограничи. Извън тях, доколкото българското право
          позволява, не отговарям за непреки вреди и пропуснати ползи. Нищо тук
          не ограничава правата ти като потребител.
        </p>
      </>
    ),
  },
  {
    id: 'iztrivane',
    title: 'Изтриване',
    body: (
      <>
        <ul>
          <li>
            <strong>Изтрий данните</strong> е в раздела „Данни“ на всеки проект.
            Изтрива само това, което този проект пази. Акаунтът и другите
            проекти остават.
          </li>
          <li>
            <strong>Изтрий Акаунта</strong> е на onovaza.com/akaunt. Изтрива
            Акаунта и данните ти във всеки проект.
          </li>
        </ul>
        <p>
          Ако някой наруши тези правила, мога да спра или изтрия Акаунта му.
          Освен при сериозна злоупотреба или ако законът ме задължава, първо ще
          пиша на имейла на Акаунта, ще кажа защо и ще дам време да отговориш и
          да изтеглиш данните си.
        </p>
      </>
    ),
  },
  {
    id: 'promeni',
    title: 'Промени',
    body: (
      <>
        <p>
          Ако променя тези условия, ще обновя датата горе и списъка по-долу.
          Важните промени ще видиш на onovaza.com/akaunt и на страницата за вход
          в продължение на 30 дни. Ако не си съгласен с тях, можеш да изтриеш
          Акаунта си по всяко време.
        </p>
        <ChangeList changes={termsChanges} />
      </>
    ),
  },
  {
    id: 'pravo',
    title: 'Приложимо право',
    body: (
      <p>
        Прилага се българското право. Ако имаш проблем, пиши ми първо на{' '}
        <Email /> и ще се опитам да го решим. Като потребител можеш да се
        обърнеш и към Комисията за защита на потребителите (
        <a href="https://kzp.bg">kzp.bg</a>) или към компетентния български съд.
        Нищо в тези условия не отнема правата ти по закон.
      </p>
    ),
  },
  // Project sections. Each project's migration plan adds its own terms right
  // after this intro, before that project's cutover, under its stable anchor
  // (`ProjectAnchor`), with the text in `src/content/legal/<anchor>.tsx`.
  // `smetkata` gets its Pro plan at billing launch; `klientite` links
  // /obrabotvane-na-danni, the processing terms for businesses. Never add an
  // empty section ahead of time.
  {
    id: 'proektite',
    title: 'Проектите',
    body: (
      <p>
        Всеки проект, който ползва Акаунта, добавя тук свой раздел, ако има свои
        правила.
      </p>
    ),
  },
  smetkataTerms,
  klientiteTerms,
  kuhnyataTerms,
]

export default function TermsPage() {
  return (
    <LegalPage
      title={title}
      lead="Правилата за Акаунта и за onovaza.com. Кратки са."
      changes={termsChanges}
      sections={sections}
      head={
        <JsonLd
          data={legalPageGraph({
            path: paths.terms(),
            name: title,
            dateModified: effectiveDate(termsChanges),
          })}
        />
      }
    />
  )
}
