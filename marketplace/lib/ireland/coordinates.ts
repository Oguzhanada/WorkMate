/**
 * Approximate center coordinates for all 32 Irish counties (Republic + NI).
 * Used for placing map markers when providers list a county as their service area.
 * Format: [latitude, longitude]
 */
export const COUNTY_COORDS: Record<string, [number, number]> = {
  // Republic of Ireland (26 counties)
  Carlow:     [52.72, -6.83],
  Cavan:      [53.99, -7.36],
  Clare:      [52.84, -8.98],
  Cork:       [51.90, -8.47],
  Donegal:    [54.83, -7.90],
  Dublin:     [53.35, -6.26],
  Galway:     [53.27, -9.05],
  Kerry:      [52.06, -9.85],
  Kildare:    [53.16, -6.91],
  Kilkenny:   [52.65, -7.25],
  Laois:      [53.00, -7.56],
  Leitrim:    [54.12, -8.00],
  Limerick:   [52.67, -8.63],
  Longford:   [53.73, -7.80],
  Louth:      [53.92, -6.49],
  Mayo:       [53.76, -9.53],
  Meath:      [53.60, -6.66],
  Monaghan:   [54.25, -6.97],
  Offaly:     [53.23, -7.72],
  Roscommon:  [53.76, -8.27],
  Sligo:      [54.15, -8.47],
  Tipperary:  [52.67, -7.83],
  Waterford:  [52.26, -7.11],
  Westmeath:  [53.53, -7.34],
  Wexford:    [52.47, -6.58],
  Wicklow:    [52.98, -6.37],

  // Northern Ireland (6 counties) — included as providers may service border areas
  Antrim:     [54.72, -6.21],
  Armagh:     [54.35, -6.66],
  Derry:      [55.00, -7.00],
  Down:       [54.39, -5.72],
  Fermanagh:  [54.34, -7.63],
  Tyrone:     [54.60, -7.31],
};

/** Ireland center point — good default for map initialization */
export const IRELAND_CENTER: [number, number] = [53.45, -7.5];

/** Default zoom level to show all of Ireland */
export const IRELAND_ZOOM = 7;

/**
 * Category-to-color mapping for map markers.
 *
 * NOTE: These MUST be hardcoded hex values (not CSS custom properties like
 * `var(--wm-*)`) because Leaflet renders markers via L.divIcon innerHTML
 * strings that are injected outside the React/CSS variable cascade. CSS vars
 * are not resolved inside Leaflet's icon HTML, so actual hex values are the
 * only reliable approach. These colors are intentionally kept in sync with
 * the design system palette but cannot reference --wm-* tokens directly.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  Plumbing:       '#3B82F6', // blue — matches --wm-blue
  Electrical:     '#F59E0B', // amber — matches --wm-amber
  Cleaning:       '#10B981', // green — matches --wm-primary
  Painting:       '#8B5CF6', // purple — matches --wm-chart-purple
  Carpentry:      '#D97706', // dark amber
  Gardening:      '#22C55E', // lime green
  Roofing:        '#EF4444', // red — matches --wm-red
  Tiling:         '#06B6D4', // cyan
  'General Maintenance': '#6366F1', // indigo
  Moving:         '#EC4899', // pink
  default:        '#10B981', // fallback to primary — matches --wm-primary
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default;
}

/**
 * Returns the name of the county whose center is closest to the given coordinates.
 * Uses squared Euclidean distance — sufficient for small-scale proximity on the island of Ireland.
 */
export function findNearestCounty(lat: number, lng: number): string | null {
  let nearestCounty: string | null = null;
  let minDistanceSq = Infinity;

  for (const [county, [cLat, cLng]] of Object.entries(COUNTY_COORDS)) {
    const dLat = lat - cLat;
    const dLng = lng - cLng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      nearestCounty = county;
    }
  }

  return nearestCounty;
}
