export interface GeocodedPoint {
  lat: number;
  lng: number;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'Boulevard-ArqCon-Site/1.0 (https://www.boulevard-arqcon.com.br)';

const cache = new Map<string, GeocodedPoint | null>();

export async function geocodeAddress(address: string): Promise<GeocodedPoint | null> {
  if (!address || !address.trim()) return null;

  const key = address.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(address)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR' },
    });
    if (!res.ok) {
      console.warn(`[geocode] HTTP ${res.status} para "${address}"`);
      cache.set(key, null);
      return null;
    }
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`[geocode] Sem resultados para "${address}"`);
      cache.set(key, null);
      return null;
    }
    const point = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    cache.set(key, point);
    return point;
  } catch (err) {
    console.warn('[geocode] Falha na requisição:', err);
    cache.set(key, null);
    return null;
  }
}
