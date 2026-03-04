export interface SearchResult {
  id: string;
  label: string;
  city: string;
  country: string;
  countryCode?: string;
  continent?: string;
  lat: number;
  lon: number;
}

interface NominatimEntry {
  lat?: number | string;
  lon?: number | string;
  display_name?: string;
  label?: string;
  place_id?: number | string;
  city?: string;
  country?: string;
  address?: Record<string, string>;
}

const SEARCH_TTL_MS = 24 * 60 * 60 * 1000;
const REVERSE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function inferContinentFromCoordinates(lat: number, lon: number): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "";
  if (lat <= -60) return "Antarctica";
  if (lat >= 5 && lat <= 82 && lon >= -170 && lon <= -20) return "North America";
  if (lat <= 15 && lat >= -60 && lon >= -92 && lon <= -30) return "South America";
  if (lat >= 35 && lon >= -25 && lon <= 60) return "Europe";
  if (lat >= -35 && lat <= 37 && lon >= -20 && lon <= 55) return "Africa";
  if (lat >= -10 && lon >= 110 && lon <= 180) return "Oceania";
  if (lat >= -50 && lon >= 110 && lon <= 180) return "Oceania";
  if (lon >= 25 && lon <= 180) return "Asia";
  return "";
}

function pickFirstAddressValue(
  address: Record<string, string>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = address[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function getCached<T>(key: string, ttlMs: number): T | null {
  if (!import.meta.client) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; value: T };
    if (!parsed || typeof parsed !== "object" || typeof parsed.ts !== "number") {
      return null;
    }
    if (Date.now() - parsed.ts > ttlMs) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

function setCached<T>(key: string, value: T): void {
  if (!import.meta.client) return;
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ ts: Date.now(), value }),
    );
  } catch {
    // Ignore cache errors.
  }
}

export function normalizeLocationResult(
  entry: NominatimEntry | null | undefined,
  fallbackLabel = "",
): SearchResult | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const lat = Number(entry.lat);
  const lon = Number(entry.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  const label = String(entry.display_name ?? entry.label ?? fallbackLabel).trim();
  if (!label) {
    return null;
  }

  const address = entry.address ?? {};
  const city =
    pickFirstAddressValue(address, [
      "city",
      "town",
      "village",
      "hamlet",
      "municipality",
      "county",
      "state",
    ]) || String(entry.city ?? "").trim();
  const country =
    pickFirstAddressValue(address, ["country"]) || String(entry.country ?? "").trim();
  const countryCode = pickFirstAddressValue(address, ["country_code"]).toUpperCase();
  const continent =
    pickFirstAddressValue(address, ["continent"]) ||
    inferContinentFromCoordinates(lat, lon);

  return {
    id: String(entry.place_id ?? label),
    label,
    city,
    country,
    countryCode,
    continent,
    lat,
    lon,
  };
}

function parseLocationResponseItems(payload: unknown): SearchResult[] {
  const entries = Array.isArray(payload) ? (payload as NominatimEntry[]) : [];
  const suggestions: SearchResult[] = [];
  const seenLabels = new Set<string>();

  for (const entry of entries) {
    const normalized = normalizeLocationResult(entry);
    if (!normalized) {
      continue;
    }

    const labelKey = normalized.label.toLowerCase();
    if (seenLabels.has(labelKey)) {
      continue;
    }

    seenLabels.add(labelKey);
    suggestions.push(normalized);
  }

  return suggestions;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }

  return response.json();
}

export async function searchLocations(
  query: string,
  limit = 6,
): Promise<SearchResult[]> {
  const lookup = String(query ?? "").trim();
  if (lookup.length < 2) {
    return [];
  }

  const normalizedLimit = Math.max(1, Math.min(Math.round(limit), 10));
  const cacheKey = `printapoint:search:${lookup.toLowerCase()}:${normalizedLimit}`;
  const cached = getCached<SearchResult[]>(cacheKey, SEARCH_TTL_MS);
  if (Array.isArray(cached)) {
    return cached;
  }

  const url =
    "https://nominatim.openstreetmap.org/search?" +
    `format=jsonv2&addressdetails=1&limit=${normalizedLimit}&q=${encodeURIComponent(lookup)}`;

  const data = await fetchJson(url);
  const results = parseLocationResponseItems(data);
  setCached(cacheKey, results);
  return results;
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<SearchResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Latitude and longitude are required.");
  }

  const roundedLat = Number(lat.toFixed(4));
  const roundedLon = Number(lon.toFixed(4));
  const cacheKey = `printapoint:reverse:${roundedLat}:${roundedLon}`;
  const cached = getCached<SearchResult>(cacheKey, REVERSE_TTL_MS);
  if (cached && typeof cached === "object") {
    return cached;
  }

  const url =
    "https://nominatim.openstreetmap.org/reverse?" +
    `format=jsonv2&addressdetails=1&zoom=10&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`;

  const data = await fetchJson(url);
  const normalized = normalizeLocationResult(data as NominatimEntry);
  if (!normalized) {
    throw new Error("No nearby city found for the selected coordinates.");
  }

  setCached(cacheKey, normalized);
  return normalized;
}
