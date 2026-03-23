export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(
  originLat: number,
  originLng: number,
  destinationLat: number,
  destinationLng: number,
): number {
  const earthRadiusKm = 6371;

  const dLat = toRadians(destinationLat - originLat);
  const dLng = toRadians(destinationLng - originLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(originLat)) *
      Math.cos(toRadians(destinationLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}
