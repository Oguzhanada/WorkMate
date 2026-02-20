"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{margin: 0, fontFamily: 'Poppins, sans-serif', background: '#f0f1f2'}}>
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '24px'
          }}
        >
          <section
            style={{
              width: 'min(560px, 100%)',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 12px 28px rgba(17, 19, 33, 0.12)',
              padding: '24px'
            }}
          >
            <h1 style={{marginTop: 0, color: '#111321'}}>Something went wrong</h1>
            <p style={{color: '#404259'}}>An unexpected error occurred. Please try again.</p>
            {error.digest ? <p style={{color: '#6b7280'}}>Ref: {error.digest}</p> : null}
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: '1px solid #2cb34f',
                background: '#2cb34f',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
