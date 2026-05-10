import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchExpertById } from '../api';
import { useSocket } from '../context/SocketContext';

export default function ExpertDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { socket, connected } = useSocket();

  const [expert,       setExpert]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // ── Fetch expert data ──────────────────────────────────────────────────────
  const loadExpert = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchExpertById(id);
      const data = res.data.data;
      setExpert(data);

      // Auto-select first available date
      const dates = [...new Set(data.availableSlots.map((s) => s.date))].sort();
      if (dates.length && !selectedDate) setSelectedDate(dates[0]);
    } catch (err) {
      setError(err.apiError?.message || 'Failed to load expert');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadExpert();
  }, [loadExpert]);

  // ── Socket.io: join expert room + listen for slot updates ──────────────────
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('joinExpert', id);

    const handleSlotBooked = ({ expertId, date, timeSlot }) => {
      if (expertId !== id) return;
      setExpert((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          availableSlots: prev.availableSlots.map((slot) =>
            slot.date === date && slot.time === timeSlot
              ? { ...slot, isBooked: true }
              : slot
          ),
        };
      });
    };

    // Heartbeat: if socket reconnects, re-fetch data to avoid stale state
    const handleSyncRequired = ({ expertId }) => {
      if (expertId === id) loadExpert();
    };

    const handleReconnect = () => {
      socket.emit('joinExpert', id);
      socket.emit('requestSync', id);
    };

    socket.on('slotBooked',    handleSlotBooked);
    socket.on('syncRequired',  handleSyncRequired);
    socket.on('connect',       handleReconnect);

    return () => {
      socket.emit('leaveExpert', id);
      socket.off('slotBooked',   handleSlotBooked);
      socket.off('syncRequired', handleSyncRequired);
      socket.off('connect',      handleReconnect);
    };
  }, [socket, id, loadExpert]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const dates = expert
    ? [...new Set(expert.availableSlots.map((s) => s.date))].sort()
    : [];

  const slotsForDate = expert && selectedDate
    ? expert.availableSlots
        .filter((s) => s.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time))
    : [];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (time) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${ampm}`;
  };

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page detail-page">
        <div className="detail-skeleton">
          <div className="skeleton-pulse" style={{ width: 120, height: 120, borderRadius: '50%' }} />
          <div className="skeleton-pulse" style={{ width: '60%', height: 28, marginTop: 16 }} />
          <div className="skeleton-pulse" style={{ width: '40%', height: 20, marginTop: 8 }} />
          <div className="skeleton-pulse" style={{ width: '100%', height: 200, marginTop: 24, borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page detail-page">
        <div className="error-state">
          <span className="error-icon">❌</span>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadExpert}>Retry</button>
        </div>
      </div>
    );
  }

  if (!expert) return null;

  return (
    <div className="page detail-page">
      <button className="btn btn-ghost back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {/* ── Expert Profile ──────────────────────────────────────────── */}
      <div className="expert-profile-card">
        <img src={expert.avatar} alt={expert.name} className="profile-avatar" />
        <div className="profile-info">
          <span className="expert-category-badge">{expert.category}</span>
          <h1 className="profile-name">{expert.name}</h1>
          <div className="profile-meta">
            <span>💼 {expert.experience} years</span>
            <span>⭐ {expert.rating.toFixed(1)}</span>
            <span>💰 ${expert.hourlyRate}/hr</span>
          </div>
          <p className="profile-bio">{expert.bio}</p>

          <div className="socket-status">
            <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
            {connected ? 'Live updates active' : 'Reconnecting…'}
          </div>
        </div>
      </div>

      {/* ── Date Tabs ───────────────────────────────────────────────── */}
      <div className="slots-section">
        <h2>Available Time Slots</h2>

        <div className="date-tabs">
          {dates.map((date) => (
            <button
              key={date}
              className={`date-tab ${selectedDate === date ? 'date-tab-active' : ''}`}
              onClick={() => setSelectedDate(date)}
            >
              {formatDate(date)}
            </button>
          ))}
        </div>

        {/* ── Time Slot Grid ──────────────────────────────────────────── */}
        <div className="time-slot-grid">
          {slotsForDate.length === 0 ? (
            <p className="no-slots">No slots available for this date</p>
          ) : (
            slotsForDate.map((slot) => (
              <button
                key={slot._id}
                className={`time-slot ${slot.isBooked ? 'slot-booked' : 'slot-available'}`}
                disabled={slot.isBooked}
                onClick={() =>
                  navigate(`/book/${id}`, {
                    state: { date: selectedDate, timeSlot: slot.time, expertName: expert.name },
                  })
                }
              >
                <span className="slot-time">{formatTime(slot.time)}</span>
                <span className="slot-status">
                  {slot.isBooked ? '🔒 Booked' : '✓ Available'}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
