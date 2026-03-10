'use client';

import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COUNTY_COORDS, IRELAND_CENTER, IRELAND_ZOOM, getCategoryColor } from '@/lib/ireland-coordinates';
import type { ProviderData } from './ProviderCard';
import Button from '@/components/ui/Button';

// ── Custom marker icon factory ──────────────────────────────────────────────

function createMarkerIcon(color: string, isHighlighted: boolean): L.DivIcon {
  const size = isHighlighted ? 32 : 24;
  const borderWidth = isHighlighted ? 3 : 2;
  return L.divIcon({
    className: 'wm-map-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      border: ${borderWidth}px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
      ${isHighlighted ? 'transform: scale(1.25); z-index: 999;' : ''}
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
}

// ── Map bounds listener ─────────────────────────────────────────────────────

type BoundsListenerProps = {
  onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void;
};

function BoundsListener({ onBoundsChange }: BoundsListenerProps) {
  const map = useMapEvents({
    moveend() {
      const b = map.getBounds();
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    },
    zoomend() {
      const b = map.getBounds();
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    },
  });
  return null;
}

// ── Fly-to helper when highlighted provider changes ─────────────────────────

function FlyToHighlighted({
  highlightedId,
  markerPositions,
}: {
  highlightedId: string | null;
  markerPositions: Map<string, [number, number]>;
}) {
  const map = useMap();
  useEffect(() => {
    if (highlightedId) {
      const pos = markerPositions.get(highlightedId);
      if (pos) {
        const currentZoom = map.getZoom();
        map.flyTo(pos, Math.max(currentZoom, 9), { duration: 0.5 });
      }
    }
  }, [highlightedId, markerPositions, map]);
  return null;
}

// ── MapView component ───────────────────────────────────────────────────────

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

type MapViewProps = {
  providers: ProviderData[];
  highlightedProviderId: string | null;
  onProviderHover: (id: string | null) => void;
  onBoundsChange: (bounds: MapBounds) => void;
  locale: string;
};

export default function MapView({
  providers,
  highlightedProviderId,
  onProviderHover,
  onBoundsChange,
  locale,
}: MapViewProps) {
  const markerPositionsRef = useRef(new Map<string, [number, number]>());

  // Build marker positions: place each provider at the center of their first listed county
  const getProviderPosition = useCallback((provider: ProviderData): [number, number] | null => {
    for (const county of provider.counties) {
      const coords = COUNTY_COORDS[county];
      if (coords) {
        // Jitter slightly so overlapping markers in same county don't stack exactly
        const jitter = () => (Math.random() - 0.5) * 0.08;
        return [coords[0] + jitter(), coords[1] + jitter()];
      }
    }
    return null;
  }, []);

  // Pre-compute positions for all providers
  const providerPositions = useRef(new Map<string, [number, number]>());

  useEffect(() => {
    const newPositions = new Map<string, [number, number]>();
    for (const p of providers) {
      // Reuse existing position if provider is already mapped
      const existing = providerPositions.current.get(p.id);
      if (existing) {
        newPositions.set(p.id, existing);
      } else {
        const pos = getProviderPosition(p);
        if (pos) newPositions.set(p.id, pos);
      }
    }
    providerPositions.current = newPositions;
    markerPositionsRef.current = newPositions;
  }, [providers, getProviderPosition]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={IRELAND_CENTER}
        zoom={IRELAND_ZOOM}
        style={{ width: '100%', height: '100%', borderRadius: 0 }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <BoundsListener onBoundsChange={onBoundsChange} />
        <FlyToHighlighted
          highlightedId={highlightedProviderId}
          markerPositions={markerPositionsRef.current}
        />

        {providers.map((provider) => {
          const pos = providerPositions.current.get(provider.id);
          if (!pos) return null;

          const category = provider.service_categories[0] ?? 'default';
          const color = getCategoryColor(category);
          const isHighlighted = highlightedProviderId === provider.id;

          return (
            <Marker
              key={provider.id}
              position={pos}
              icon={createMarkerIcon(color, isHighlighted)}
              eventHandlers={{
                mouseover: () => onProviderHover(provider.id),
                mouseout: () => onProviderHover(null),
              }}
            >
              <Popup>
                <MapPopupCard provider={provider} locale={locale} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

// ── Popup card shown when clicking a map marker ─────────────────────────────

function MapPopupCard({ provider, locale }: { provider: ProviderData; locale: string }) {
  const initials = provider.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        fontFamily: 'var(--wm-font-sans)',
        minWidth: '200px',
        maxWidth: '260px',
      }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            overflow: 'hidden',
            flexShrink: 0,
            background: provider.avatar_url ? 'var(--wm-surface-alt)' : 'var(--wm-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {provider.avatar_url ? (
            <img
              src={provider.avatar_url}
              alt={provider.full_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>
              {initials}
            </span>
          )}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--wm-text)' }}>
            {provider.full_name}
          </div>
          {provider.service_categories.length > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--wm-muted)' }}>
              {provider.service_categories[0]}
            </div>
          )}
        </div>
      </div>

      {provider.average_rating !== null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '8px',
            fontSize: '13px',
          }}
        >
          <span style={{ color: 'var(--wm-amber)' }}>&#9733;</span>
          <span style={{ fontWeight: 600, color: 'var(--wm-text)' }}>
            {provider.average_rating}
          </span>
          <span style={{ color: 'var(--wm-muted)' }}>({provider.review_count} reviews)</span>
        </div>
      )}

      <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
        <Button
          href={`/${locale}/profile/public/${provider.id}`}
          variant="primary"
          size="sm"
        >
          View Profile
        </Button>
      </div>
    </div>
  );
}
