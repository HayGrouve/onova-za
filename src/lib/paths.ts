import type { Route } from 'next'

// Every internal URL is built here so cards, sitemap, canonicals and
// structured data can never disagree.
export const paths = {
  home: () => '/' as Route,
  projects: () => '/proekti' as Route,
  project: (slug: string) => `/proekti/${slug}` as Route,
  about: () => '/za-men' as Route,
}
