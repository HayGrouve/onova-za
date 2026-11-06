import type { Route } from 'next'

// Every internal URL is built here so cards, sitemap, canonicals and
// structured data can never disagree.
export const paths = {
  home: () => '/' as Route,
  projects: () => '/proekti' as Route,
  project: (slug: string) => `/proekti/${slug}` as Route,
  about: () => '/za-men' as Route,
  contact: () => '/za-men#pishi-mi' as Route,
  // Вход sends you back to `redirectUrl` (path and query) afterwards.
  vhod: (redirectUrl?: string) =>
    (redirectUrl
      ? `/vhod?redirect_url=${encodeURIComponent(redirectUrl)}`
      : '/vhod') as Route,
  akaunt: () => '/akaunt' as Route,
}
