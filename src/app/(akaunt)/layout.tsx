import { ClerkProvider } from '@clerk/nextjs'

// Clerk loads only on /vhod and /akaunt (#23): every route in this group gets
// the provider, and no page outside it imports @clerk/nextjs, so the library,
// the index, project pages and /za-men stay Clerk-free and static.
//
// Rules from #13 that keep these two routes static too: Clerk UI only in
// 'use client' files, no `auth()` or `<Show>` in server components, no
// `dynamic` prop, no proxy (middleware), no secret key.
//
// The publishable key and the sign-in URLs come from NEXT_PUBLIC_CLERK_* env.
// Without a key (CI builds) the provider still renders but loads no clerk-js,
// so Clerk components on these pages render empty instead of failing.
export default function AkauntLayout({ children }: LayoutProps<'/'>) {
  return <ClerkProvider>{children}</ClerkProvider>
}
