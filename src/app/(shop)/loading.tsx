export default function Loading() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="aspect-[3/4] animate-pulse rounded-card bg-surface" />
      ))}
    </div>
  )
}
