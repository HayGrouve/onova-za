// A section heading with a hairline running to the edge. With a single group
// the label says nothing new, so it stays for screen readers only.
export function GroupHeading({
  id,
  only = false,
  children,
}: {
  id: string
  only?: boolean
  children: string
}) {
  return (
    <h2
      id={id}
      className={
        only
          ? 'sr-only'
          : 'after:bg-border mb-3 flex items-center gap-4 text-[1.375rem] leading-tight font-semibold after:h-px after:flex-1'
      }
    >
      {children}
    </h2>
  )
}
