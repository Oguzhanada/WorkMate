import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * GET /og?title=...&description=...
 * Generates a dynamic Open Graph image for social sharing.
 * Used by page metadata: openGraph.images = [{ url: '/og?title=...' }]
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') || 'WorkMate';
  const description =
    searchParams.get('description') ||
    "Ireland's trusted marketplace for home services";

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '60px 80px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #10b981, #2563eb)',
          }}
        />

        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 800,
            }}
          >
            W
          </div>
          <span
            style={{
              color: '#e2e8f0',
              fontSize: '28px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            WorkMate
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            color: '#ffffff',
            fontSize: title.length > 40 ? '48px' : '56px',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            margin: 0,
            maxWidth: '900px',
          }}
        >
          {title}
        </h1>

        {/* Description */}
        <p
          style={{
            color: '#94a3b8',
            fontSize: '24px',
            lineHeight: 1.4,
            marginTop: '20px',
            maxWidth: '700px',
          }}
        >
          {description}
        </p>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '80px',
            right: '80px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#64748b', fontSize: '18px' }}>workmate.ie</span>
          <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 600 }}>
            Ireland&apos;s Home Services Marketplace
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
