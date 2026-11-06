import type { Metadata } from 'next'
import type {
  BreadcrumbList,
  CollectionPage,
  CreativeWork,
  Graph,
  Person,
  ProfilePage,
  SoftwareApplication,
  Thing,
  WebApplication,
  WebPage,
  WebSite,
} from 'schema-dts'

import { TYPES } from '@/content/taxonomy'

import { paths } from './paths'
import type { Project } from './project-schema'
import { SITE_URL, site } from './site'

export const absolute = (path: string) =>
  path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`

// The site-wide share image (app/opengraph-image.tsx). Segments with their own
// opengraph-image file (projects) override it, because file metadata wins.
const siteImage = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'онова за: малки приложения и сайтове. Всяко е за нещо.',
}

// Per-page metadata. Next merges `openGraph` shallowly, so every page sends a
// complete object (image included) instead of relying on the root layout's.
export function pageMeta({
  path,
  title,
  description,
  absoluteTitle = false,
  noindex = false,
}: {
  path: string
  title: string
  description: string
  absoluteTitle?: boolean
  noindex?: boolean
}): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'website',
      locale: site.locale,
      siteName: site.name,
      url: path,
      title: absoluteTitle ? title : `${title} | ${site.name}`,
      description,
      images: [siteImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: absoluteTitle ? title : `${title} | ${site.name}`,
      description,
      images: [siteImage],
    },
  }
}

// "{Име}: {какво прави}". Bulgarian continues in lowercase after a colon,
// unless the pitch starts with an acronym or a name ("AI", "Git").
export function projectTitle(p: Project) {
  if (p.seo?.title) return p.seo.title
  const pitch = p.pitch.replace(/\.$/, '')
  const [first = ''] = pitch.split(' ')
  const keepCase = first.length > 1 && first === first.toLocaleUpperCase('bg')
  return `${p.name}: ${keepCase ? pitch : pitch[0].toLocaleLowerCase('bg') + pitch.slice(1)}`
}

// Stable ids so entities on different pages link up.
const ids = {
  website: `${SITE_URL}/#website`,
  person: `${SITE_URL}/#person`,
  brand: `${SITE_URL}/#brand`,
}

export const personNode: Person = {
  '@type': 'Person',
  '@id': ids.person,
  name: site.author.name,
  alternateName: [site.author.latinName, site.author.handle],
  url: absolute(paths.about()),
  jobTitle: site.author.role,
  address: {
    '@type': 'PostalAddress',
    addressLocality: site.author.city,
    addressCountry: 'BG',
  },
  sameAs: Object.values(site.author.profiles),
}

export function homeGraph(): Graph {
  const website: WebSite = {
    '@type': 'WebSite',
    '@id': ids.website,
    url: absolute('/'),
    name: site.name,
    alternateName: [site.latinName],
    inLanguage: 'bg',
    publisher: { '@id': ids.person },
  }
  const brand = {
    '@type': 'Brand',
    '@id': ids.brand,
    name: site.name,
    url: absolute('/'),
  } satisfies Thing
  return {
    '@context': 'https://schema.org',
    '@graph': [website, personNode, brand],
  }
}

function breadcrumbs(items: { name: string; path?: string }[]): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.path ? { item: absolute(item.path) } : {}),
    })),
  }
}

export function collectionGraph(projects: readonly Project[]): Graph {
  const page: CollectionPage = {
    '@type': 'CollectionPage',
    url: absolute(paths.projects()),
    name: 'Всички проекти',
    inLanguage: 'bg',
    isPartOf: { '@id': ids.website },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: projects.length,
      itemListElement: projects.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absolute(paths.project(p.slug)),
        name: p.name,
      })),
    },
    breadcrumb: breadcrumbs([
      { name: 'Начало', path: '/' },
      { name: 'Проекти' },
    ]),
  }
  return { '@context': 'https://schema.org', '@graph': [page] }
}

const APP_CATEGORY: Partial<Record<string, string>> = {
  pari: 'FinanceApplication',
  hrana: 'LifestyleApplication',
  kafe: 'LifestyleApplication',
  pochivka: 'TravelApplication',
  kod: 'DeveloperApplication',
}

// Own apps are WebApplication (or SoftwareApplication for desktop builds);
// client sites and systems are CreativeWork made by the person.
export function projectGraph(p: Project): Graph {
  const url = absolute(paths.project(p.slug))
  const subjectId = `${url}#subject`

  let subject: WebApplication | SoftwareApplication | CreativeWork
  if (p.owner === 'own' && (p.type === 'app' || p.type === 'desktop')) {
    const common = {
      '@id': subjectId,
      name: p.name,
      description: p.description,
      inLanguage: p.uiLanguage,
      applicationCategory: APP_CATEGORY[p.topics[0]] ?? 'UtilitiesApplication',
      creator: { '@id': ids.person },
      brand: { '@id': ids.brand },
      ...(p.links.live ? { url: p.links.live } : {}),
      ...(p.links.github ? { codeRepository: p.links.github } : {}),
    }
    subject =
      p.type === 'desktop'
        ? {
            '@type': 'SoftwareApplication',
            ...common,
            operatingSystem: 'Windows, macOS',
          }
        : {
            '@type': 'WebApplication',
            ...common,
            operatingSystem: 'Any',
            browserRequirements: 'Requires JavaScript',
          }
  } else {
    subject = {
      '@type': 'CreativeWork',
      '@id': subjectId,
      name: p.name,
      description: p.description,
      genre: TYPES[p.type].label,
      dateCreated: String(p.years.from),
      creator: { '@id': ids.person },
      inLanguage: 'bg',
      ...(p.links.live ? { url: p.links.live } : {}),
    }
  }

  const page: WebPage = {
    '@type': 'WebPage',
    '@id': `${url}#page`,
    url,
    name: projectTitle(p),
    description: p.description,
    inLanguage: 'bg',
    dateModified: p.updatedAt,
    isPartOf: { '@id': ids.website },
    mainEntity: { '@id': subjectId },
    breadcrumb: breadcrumbs([
      { name: 'Начало', path: '/' },
      { name: 'Проекти', path: paths.projects() },
      { name: p.name },
    ]),
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [page, subject, personNode],
  }
}

export function profileGraph(dateModified: string): Graph {
  const page: ProfilePage = {
    '@type': 'ProfilePage',
    url: absolute(paths.about()),
    inLanguage: 'bg',
    dateModified,
    mainEntity: { '@id': ids.person },
    isPartOf: { '@id': ids.website },
  }
  return { '@context': 'https://schema.org', '@graph': [page, personNode] }
}

// The privacy policy and the terms: a plain WebPage dated by its newest change.
export function legalPageGraph({
  path,
  name,
  dateModified,
}: {
  path: string
  name: string
  dateModified: string
}): Graph {
  const page: WebPage = {
    '@type': 'WebPage',
    url: absolute(path),
    name,
    inLanguage: 'bg',
    dateModified,
    isPartOf: { '@id': ids.website },
    publisher: { '@id': ids.person },
    breadcrumb: breadcrumbs([{ name: 'Начало', path: '/' }, { name }]),
  }
  return { '@context': 'https://schema.org', '@graph': [page, personNode] }
}
