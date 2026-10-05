import { ogSize, siteOgImage } from '@/lib/og'
import { projects } from '@/lib/projects'

export const alt = 'онова за: малки приложения и сайтове. Всяко е за нещо.'
export const size = ogSize
export const contentType = 'image/png'

export default function Image() {
  return siteOgImage(projects)
}
