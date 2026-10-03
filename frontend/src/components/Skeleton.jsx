import React from 'react';
import './Skeleton.css';

const BARIS = [0, 1, 2];

/**
 * Placeholder daftar selagi data dimuat.
 * Mengganti spinner agar tata letak tidak melompat dan area tidak berputar.
 */
export default function Skeleton() {
  return (
    <ul className="skeleton" aria-hidden="true">
      {BARIS.map((baris) => (
        <li key={baris} className="skeleton__item">
          <span className="skeleton__box" />
          <span className="skeleton__line" />
          <span className="skeleton__actions">
            <span className="skeleton__icon" />
            <span className="skeleton__icon" />
          </span>
        </li>
      ))}
    </ul>
  );
}