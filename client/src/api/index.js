import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── 409 interceptor for conflict-aware UI ────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      const { status, data } = err.response;

      // Attach structured error info for easy consumption by components
      err.apiError = {
        status,
        message: data?.message || 'Something went wrong',
        errors: data?.errors || [],
        isConflict: status === 409,
      };
    } else {
      err.apiError = {
        status: 0,
        message: 'Network error — please check your connection',
        errors: [],
        isConflict: false,
      };
    }
    return Promise.reject(err);
  }
);

// ── Expert APIs ──────────────────────────────────────────────────────────────
export const fetchExperts = (params) => api.get('/experts', { params });
export const fetchExpertById = (id) => api.get(`/experts/${id}`);

// ── Booking APIs ─────────────────────────────────────────────────────────────
export const createBooking = (data) => api.post('/bookings', data);
export const updateBookingStatus = (id, status) => api.patch(`/bookings/${id}/status`, { status });
export const fetchBookingsByEmail = (email) => api.get('/bookings', { params: { email } });

export default api;
