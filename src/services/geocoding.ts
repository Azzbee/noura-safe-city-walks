// Nominatim geocoding service for Paris

export interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    postcode?: string;
  };
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Paris bounding box for search prioritization
const PARIS_VIEWBOX = '2.2241,48.8155,2.4699,48.9022';

export async function searchAddress(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 3) {
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '5',
    viewbox: PARIS_VIEWBOX,
    bounded: '1',
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
    headers: {
      'User-Agent': 'NouraParis/1.0',
    },
  });

  if (!response.ok) {
    throw new Error('Geocoding service error');
  }

  return response.json();
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: 'json',
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
    headers: {
      'User-Agent': 'NouraParis/1.0',
    },
  });

  if (!response.ok) {
    throw new Error('Reverse geocoding error');
  }

  const data = await response.json();
  return data.display_name || 'Unknown location';
}

export function formatAddress(result: SearchResult): string {
  const { address } = result;
  if (!address) {
    return result.display_name;
  }

  const parts: string[] = [];
  
  if (address.house_number && address.road) {
    parts.push(`${address.house_number} ${address.road}`);
  } else if (address.road) {
    parts.push(address.road);
  }

  if (address.suburb) {
    parts.push(address.suburb);
  }

  if (address.postcode) {
    parts.push(address.postcode);
  }

  return parts.join(', ') || result.display_name;
}
