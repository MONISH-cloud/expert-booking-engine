import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { createBooking } from '../api';
import ConflictModal from '../components/ConflictModal';

const INIT = { userName: '', email: '', phone: '', notes: '' };

export default function BookingPage() {
  const { expertId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { date, timeSlot, expertName } = state || {};

  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [conflict, setConflict] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const [slotPending, setSlotPending] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.userName.trim() || form.userName.trim().length < 2) e.userName = 'Name must be at least 2 chars';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!/^\+?[\d\s\-().]{10,15}$/.test(form.phone)) e.phone = 'Phone: 10–15 digits';
    if (form.notes.length > 500) e.notes = 'Max 500 chars';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerErr('');
    if (!validate()) return;
    setSubmitting(true);
    setSlotPending(true);
    try {
      const res = await createBooking({ expertId, userName: form.userName.trim(), email: form.email.trim(), phone: form.phone.trim(), date, timeSlot, notes: form.notes.trim() });
      setSuccess(res.data.data);
    } catch (err) {
      if (err.apiError?.isConflict) { setConflict(true); setSlotPending(false); return; }
      setSlotPending(false);
      if (err.apiError?.errors?.length) {
        const fe = {};
        err.apiError.errors.forEach((x) => { fe[x.field] = x.message; });
        setErrors(fe);
      } else { setServerErr(err.apiError?.message || 'Booking failed'); }
    } finally { setSubmitting(false); }
  };

  if (!date || !timeSlot) {
    return (<div className="page booking-page"><div className="error-state"><span className="error-icon">⚠️</span><p>No slot selected.</p><button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button></div></div>);
  }

  const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const fmtTime = (t) => { const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`; };

  if (success) {
    return (
      <div className="page booking-page">
        <div className="success-card">
          <div className="success-icon">🎉</div>
          <h2>Booking Confirmed!</h2>
          <p>Your session has been booked successfully.</p>
          <div className="booking-summary">
            <div className="summary-row"><span className="summary-label">Expert</span><span className="summary-value">{expertName}</span></div>
            <div className="summary-row"><span className="summary-label">Date</span><span className="summary-value">{fmtDate(success.date)}</span></div>
            <div className="summary-row"><span className="summary-label">Time</span><span className="summary-value">{fmtTime(success.timeSlot)}</span></div>
            <div className="summary-row"><span className="summary-label">Status</span><span className="status-badge status-pending">{success.status}</span></div>
          </div>
          <div className="success-actions">
            <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>View My Bookings</button>
            <button className="btn btn-outline" onClick={() => navigate('/')}>Browse Experts</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page booking-page">
      {conflict && <ConflictModal onClose={() => setConflict(false)} onRefresh={() => navigate(`/experts/${expertId}`)} />}
      <button className="btn btn-ghost back-btn" onClick={() => navigate(-1)}>← Back</button>
      <div className="booking-layout">
        <div className="slot-summary-card">
          <h3>Booking Summary</h3>
          <div className="slot-summary-details">
            <p><strong>Expert:</strong> {expertName}</p>
            <p><strong>Date:</strong> {fmtDate(date)}</p>
            <p><strong>Time:</strong> {fmtTime(timeSlot)}</p>
          </div>
          {slotPending && <div className="slot-pending-indicator"><div className="spinner-small" /><span>Reserving slot…</span></div>}
        </div>
        <form className="booking-form" onSubmit={handleSubmit} noValidate>
          <h2>Complete Your Booking</h2>
          {serverErr && <div className="form-error-banner">{serverErr}</div>}
          <div className={`form-group ${errors.userName ? 'has-error' : ''}`}>
            <label htmlFor="userName">Full Name *</label>
            <input id="userName" name="userName" type="text" placeholder="John Doe" value={form.userName} onChange={handleChange} />
            {errors.userName && <span className="field-error">{errors.userName}</span>}
          </div>
          <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
            <label htmlFor="email">Email *</label>
            <input id="email" name="email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className={`form-group ${errors.phone ? 'has-error' : ''}`}>
            <label htmlFor="phone">Phone *</label>
            <input id="phone" name="phone" type="tel" placeholder="+91 9876543210" value={form.phone} onChange={handleChange} />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>
          <div className={`form-group ${errors.notes ? 'has-error' : ''}`}>
            <label htmlFor="notes">Notes (optional)</label>
            <textarea id="notes" name="notes" placeholder="Anything the expert should know…" value={form.notes} onChange={handleChange} rows={4} />
            {errors.notes && <span className="field-error">{errors.notes}</span>}
            <span className="char-count">{form.notes.length}/500</span>
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={submitting}>
            {submitting ? <><div className="spinner-small" /> Booking…</> : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
