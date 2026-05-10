import { Link } from 'react-router-dom';

export default function ExpertCard({ expert }) {
  const { _id, name, category, experience, rating, avatar, hourlyRate } = expert;

  return (
    <Link to={`/experts/${_id}`} className="expert-card">
      <div className="expert-card-header">
        <img
          src={avatar}
          alt={name}
          className="expert-avatar"
          loading="lazy"
        />
        <span className="expert-category-badge">{category}</span>
      </div>

      <div className="expert-card-body">
        <h3 className="expert-name">{name}</h3>

        <div className="expert-meta">
          <span className="expert-experience">
            <span className="meta-icon">💼</span>
            {experience} yr{experience > 1 ? 's' : ''}
          </span>
          <span className="expert-rating">
            <span className="meta-icon">⭐</span>
            {rating.toFixed(1)}
          </span>
        </div>

        <div className="expert-rate">
          <span className="rate-amount">${hourlyRate}</span>
          <span className="rate-label">/hr</span>
        </div>
      </div>

      <div className="expert-card-footer">
        <span className="view-profile-btn">View Profile →</span>
      </div>
    </Link>
  );
}
