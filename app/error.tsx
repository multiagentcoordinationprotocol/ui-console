'use client';

import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="stack" style={{ maxWidth: 600, margin: '4rem auto', textAlign: 'center' }}>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Something went wrong</h3>
        </div>
        <div className="card-content">
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
            {error.message || 'An unexpected error occurred while rendering this page.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="button button-primary" onClick={reset}>
              Try again
            </button>
            <Link href="/" className="button button-secondary">
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
