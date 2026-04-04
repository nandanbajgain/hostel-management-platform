export default function CardListSkeleton({
  rows = 4,
  height = 120,
}: {
  rows?: number
  height?: number
}) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="card skeleton-block" style={{ height }} />
      ))}
    </div>
  )
}

