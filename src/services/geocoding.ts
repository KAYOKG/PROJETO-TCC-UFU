/**
 * Reverse geocoding via Nominatim (OpenStreetMap).
 * Política de uso: 1 req/s, User-Agent obrigatório.
 */

export interface GeocodingResult {
  city?: string;
  state?: string;
  country?: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<GeocodingResult> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "SistemaRAA-TCC-UFU/1.0 (contato@exemplo.com)",
      },
    });
    if (!res.ok) return {};
    const data = (await res.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        state?: string;
        country?: string;
      };
    };
    const addr = data?.address;
    if (!addr) return {};
    const city =
      addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? undefined;
    return {
      city,
      state: addr.state,
      country: addr.country,
    };
  } catch {
    return {};
  }
}
