import type { LatLng, LatLngBounds } from "./types";

export function getBoundsFromCenterZoom(
  center: LatLng,
  zoom: number,
  viewport: { width: number; height: number },
): LatLngBounds {
  const { lat, lng } = center;
  const { width, height } = viewport;

  // Scale at this latitude
  const scale =
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);

  // Distance covered by half the viewport
  const halfWidthMeters = (width / 2) * scale;
  const halfHeightMeters = (height / 2) * scale;

  // Offset in degrees
  const latOffset = halfHeightMeters / 111320;
  const lngOffset =
    halfWidthMeters / (111320 * Math.cos((lat * Math.PI) / 180));

  return {
    north: lat + latOffset,
    south: lat - latOffset,
    east: lng + lngOffset,
    west: lng - lngOffset,
  };
}
