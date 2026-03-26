export default function StatsGridSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="card skeleton-block" style={{ height: 116 }} />
      ))}
    </div>
  )
}
