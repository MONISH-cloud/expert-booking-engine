import { useState } from 'react';
import { fetchBookingsByEmail } from '../api';

export default function MyBookingsPage() {
  const [email,    setEmail]    = useState('');
  const [bookings, setBookings] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchBookingsByEmail(email.trim());
      setBookings(res.data.data);
    } catch (err) {
      setError(err.apiError?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  const fmtTime = (t) => {
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const statusConfig = {
    pending:   { cls: 'status-pending',   icon: '🕐', label: 'Pending' },
    confirmed: { cls: 'status-confirmed', icon: '✅', label: 'Confirmed' },
    completed: { cls: 'status-completed', icon: '🎓', label: 'Completed' },
  };

  // Split into upcoming and past
  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings ? bookings.filter((b) => b.date >= today) : [];
  const past     = bookings ? bookings.filter((b) => b.date  < today) : [];

  const BookingCard = ({ b }) => {
    const sc  = statusConfig[b.status] || statusConfig.pending;
    const isPast = b.date < today;
    return (
      <div className={`booking-card ${isPast ? 'booking-card-past' : ''}`}>
        <div className="timeline-dot">
          <span className="timeline-icon">{sc.icon}</span>
        </div>
        <div className="booking-card-inner">
          <div className="booking-card-header">
            <div>
              <h3>{b.expertName}</h3>
              <p className="booking-datetime">
                📅 {fmtDate(b.date)} &nbsp;·&nbsp; 🕐 {fmtTime(b.timeSlot)}
              </p>
            </div>
            <span className={`status-badge ${sc.cls}`}>
              {sc.icon} {sc.label}
            </span>
          </div>
          <div className="booking-card-body">
            <div className="booking-detail">
              <span className="detail-label">👤 Name</span>
              <span>{b.userName}</span>
            </div>
            <div className="booking-detail">
              <span className="detail-label">📞 Phone</span>
              <span>{b.phone}</span>
            </div>
            <div className="booking-detail">
              <span className="detail-label">📧 Email</span>
              <span>{b.email}</span>
            </div>
            {b.notes && (
              <div className="booking-detail full-width">
                <span className="detail-label">📝 Notes</span>
                <span>{b.notes}</span>
              </div>
            )}
          </div>
          <div className="booking-card-footer">
            <span className="booking-id">Ref: #{b._id.slice(-8).toUpperCase()}</span>
            <span className="booking-created">
              Booked on {new Date(b.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page my-bookings-page">
      <div className="page-header">
        <h1>My Bookings</h1>
        <p className="page-subtitle">Enter your email to view your session history</p>
      </div>

      {/* ── Email Search ────────────────────────────────────────────── */}
      <form className="email-search-form" onSubmit={handleSearch}>
        <div className="search-wrapper">
          <span className="search-icon">📧</span>
          <input
            id="booking-email"
            type="email"
            placeholder="Enter your email address…"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="search-input"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <><div className="spinner-small" /> Searching…</> : 'Search'}
        </button>
      </form>

      {error && (
        <div className="error-state">
          <span className="error-icon">❌</span>
          <p>{error}</p>
        </div>
      )}

      {/* ── Results Timeline ─────────────────────────────────────────── */}
      {bookings !== null && (
        bookings.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No bookings found</h3>
            <p>No sessions are linked to this email</p>
          </div>
        ) : (
          <div className="bookings-timeline">
            <p className="results-count">
              {bookings.length} session{bookings.length > 1 ? 's' : ''} found
            </p>

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="timeline-section">
                <h2 className="timeline-section-title">
                  <span className="timeline-section-dot upcoming-dot" />
                  Upcoming Sessions ({upcoming.length})
                </h2>
                <div className="timeline-list">
                  {upcoming.map((b) => <BookingCard key={b._id} b={b} />)}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div className="timeline-section">
                <h2 className="timeline-section-title">
                  <span className="timeline-section-dot past-dot" />
                  Past Sessions ({past.length})
                </h2>
                <div className="timeline-list">
                  {past.map((b) => <BookingCard key={b._id} b={b} />)}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
