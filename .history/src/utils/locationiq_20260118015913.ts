import axios, { AxiosError } from 'axios';

const API_KEY = import.meta.env.VITE_LOCATIONIQ_KEY;

if (!API_KEY) {
  console.error('LocationIQ API key is missing! Add VITE_LOCATIONIQ_KEY=your_key to .env.local or .env');
  // You could throw here in production builds if you want to fail fast
}

// Recommended: use EU region for better latency in India
// Alternative: 'https://api.locationiq.com/v1/' (anycast) or 'https://us1.locationiq.com/v1/'
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
  // address?: { ... } when addressdetails=1
  // You can extend this based on what you actually use
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
    // ... more possible fields
  };
  boundingbox: string[];
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
          countrycodes: 'in',           // ← Bias to India
          addressdetails: 1,            // ← Get address object
          format: 'json',
          // Optional extras you might want:
          // normalizecity: 1,
          // viewbox: '75.7,11.0,77.0,12.5', // e.g. bounding box around Kerala
          // bounded: 1,
        },
      }
    );

    return response.data;
  } catch (error) {
    const err = error as AxiosError;
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
    const err = error as AxiosError;
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