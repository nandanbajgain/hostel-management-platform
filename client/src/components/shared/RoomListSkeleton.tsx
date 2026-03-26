export default function RoomListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="card skeleton-block" style={{ height: 116 }} />
      ))}
    </div>
  )
}
