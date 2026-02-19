import axios, { AxiosError } from 'axios';

const API_KEY = import.meta.env.VITE_LOCATIONIQ_KEY;

if (!API_KEY) {
  console.error('LocationIQ API key is missing! Add VITE_LOCATIONIQ_KEY=your_key to .env.local or .env');
}

const BASE_URL = 'https://eu1.locationiq.com/v1';

export interface LocationSuggestion {
  place_id: number;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  place_rank: number;
  category?: string;
  type?: string;
  importance: number;
}

export interface ReverseGeocodeResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  place_rank: number;
  category: string;
  type: string;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: {
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state_district?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
    neighbourhood?: string;
    road?: string;
  };
  boundingbox: string[];
}

interface LocationIQErrorResponse {
  error?: string;
}

export const searchLocations = async (query: string): Promise<LocationSuggestion[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    const response = await axios.get<LocationSuggestion[]>(
      `${BASE_URL}/autocomplete`,
      {
        params: {
          key: API_KEY,
          q: query,
          limit: 6,
          countrycodes: 'in',
          addressdetails: 1,
          format: 'json',
        },
      }
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError<LocationIQErrorResponse>;
    console.error('Location search failed:', err.message, err.response?.data);
    throw new Error(
      err.response?.data?.error
        ? `LocationIQ: ${err.response.data.error}`
        : 'Failed to search locations. Please try again.'
    );
  }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<ReverseGeocodeResult> => {
  try {
    const response = await axios.get<ReverseGeocodeResult>(
      `${BASE_URL}/reverse`,
      {
        params: {
          key: API_KEY,
          lat,
          lon,
          format: 'json',
          addressdetails: 1,
          zoom: 14,
        },
      }
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError<LocationIQErrorResponse>;
    console.error('Reverse geocoding failed:', err.message, err.response?.data);
    throw new Error(
      err.response?.data?.error
        ? `LocationIQ: ${err.response.data.error}`
        : 'Failed to get address from coordinates.'
    );
  }
};

export const getDisplayName = (result: ReverseGeocodeResult | null): string => {
  if (!result) return '';
  return result.display_name ||
    `${result.address?.village || result.address?.town || result.address?.city || 'Unknown'}, ${result.address?.state || ''}`;
};