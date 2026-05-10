export default function SkeletonCard({ count = 6 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="skeleton-card">
      <div className="skeleton-avatar skeleton-pulse" />
      <div className="skeleton-line skeleton-pulse" style={{ width: '70%' }} />
      <div className="skeleton-line skeleton-pulse" style={{ width: '50%' }} />
      <div className="skeleton-line skeleton-pulse" style={{ width: '40%' }} />
    </div>
  ));
}
