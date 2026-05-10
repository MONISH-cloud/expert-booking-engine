import { useState, useEffect, useCallback } from 'react';
import { fetchExperts } from '../api';
import { useDebounce } from '../hooks';
import ExpertCard from '../components/ExpertCard';
import SkeletonCard from '../components/SkeletonCard';

const CATEGORIES = ['All', 'Technology', 'Healthcare', 'Finance', 'Legal', 'Design', 'Marketing', 'Education', 'Business'];

export default function ExpertListPage() {
  const [experts,  setExperts]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [page,     setPage]     = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const loadExperts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 9 };
      if (category !== 'All') params.category = category;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = await fetchExperts(params);
      setExperts(res.data.data.experts);
      setTotalPages(res.data.data.pages);
    } catch (err) {
      setError(err.apiError?.message || 'Failed to load experts');
    } finally {
      setLoading(false);
    }
  }, [page, category, debouncedSearch]);

  useEffect(() => {
    loadExperts();
  }, [loadExperts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [category, debouncedSearch]);

  return (
    <div className="page expert-list-page">
      <div className="page-header">
        <h1>Find Your Expert</h1>
        <p className="page-subtitle">
          Book sessions with top professionals across industries
        </p>
      </div>

      {/* ── Search & Filters ─────────────────────────────────────────── */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            id="expert-search"
            type="text"
            placeholder="Search experts by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <div className="category-chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`chip ${category === cat ? 'chip-active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error State ──────────────────────────────────────────────── */}
      {error && (
        <div className="error-state">
          <span className="error-icon">❌</span>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadExperts}>Retry</button>
        </div>
      )}

      {/* ── Expert Grid ──────────────────────────────────────────────── */}
      <div className="expert-grid">
        {loading ? (
          <SkeletonCard count={9} />
        ) : experts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔎</span>
            <h3>No experts found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          experts.map((expert) => (
            <ExpertCard key={expert._id} expert={expert} />
          ))
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Previous
          </button>
          <span className="page-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
