'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480, padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
            {error.message || 'A critical error occurred. Please try again.'}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1.5rem',
              border: '1px solid #334155',
              borderRadius: '0.375rem',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
