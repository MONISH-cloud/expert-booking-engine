import { useState } from 'react';

export default function ConflictModal({ onClose, onRefresh }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content conflict-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">⚠️</div>
        <h2>Slot Already Taken!</h2>
        <p>
          Another user just booked this time slot. The available slots have been
          refreshed automatically. Please choose a different time.
        </p>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onRefresh}>
            View Updated Slots
          </button>
        </div>
      </div>
    </div>
  );
}
