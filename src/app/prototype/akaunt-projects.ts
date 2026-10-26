// PROTOTYPE, throwaway (ticket #19). The real hub would mark these in
// project data (a field such as `akaunt: true`), not list slugs by hand.
import { projects } from '@/lib/projects'

const SLUGS = ['onova-za-smetkata', 'onova-za-klientite', 'chef', 'dial-in']

export const akauntProjects = SLUGS.map((slug) => {
  const p = projects.find((x) => x.slug === slug)!
  return { slug, za: p.za, hue: p.hue, name: p.name, live: p.links.live }
})
