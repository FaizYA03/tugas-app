import React from 'react';
import './ProgressBar.css';

/**
 * Ringkasan progres: "X dari Y tugas selesai" beserta progress bar tipis.
 */
export default function ProgressBar({ total, selesai }) {
  const persen = total === 0 ? 0 : Math.round((selesai / total) * 100);

  return (
    <div className="progress">
      <div className="progress__meta">
        <p className="progress__label">
          <strong className="progress__count">{selesai}</strong>
          <span className="progress__separator">dari</span>
          <strong className="progress__count">{total}</strong>
          <span>tugas selesai</span>
        </p>
        <span className="progress__percent">{persen}%</span>
      </div>

      <div
        className="progress__track"
        role="progressbar"
        aria-valuenow={persen}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progres penyelesaian tugas"
      >
        <div className="progress__bar" style={{ width: `${persen}%` }} />
      </div>
    </div>
  );
}