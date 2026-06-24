export interface GeoResult {
  lat: number;
  lon: number;
  citycode: string;
  city: string;
  label: string;
}

export async function geocodeAddress(address: string): Promise<GeoResult> {
  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const json = await res.json() as { features: Array<{ geometry: { coordinates: [number, number] }; properties: { citycode: string; city: string; label: string } }> };
  if (!json.features?.length) throw new Error("Adresse non trouvée.");
  const feat = json.features[0];
  return {
    lat: feat.geometry.coordinates[1],
    lon: feat.geometry.coordinates[0],
    citycode: feat.properties.citycode,
    city: feat.properties.city,
    label: feat.properties.label,
  };
}
