// PROTOTYPE, throwaway (ticket #19): never served in production builds.
import { notFound } from 'next/navigation'

export default function PrototypeLayout({
  children,
}: LayoutProps<'/prototype'>) {
  if (process.env.NODE_ENV === 'production') notFound()
  return children
}
