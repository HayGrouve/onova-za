// A section heading with a hairline running to the edge.
export function GroupHeading({
  id,
  children,
}: {
  id: string
  children: string
}) {
  return (
    <h2
      id={id}
      className="after:bg-border mb-3 flex items-center gap-4 text-[1.375rem] leading-tight font-semibold after:h-px after:flex-1"
    >
      {children}
    </h2>
  )
}
