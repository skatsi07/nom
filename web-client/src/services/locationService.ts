export interface LocationResult {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    boundingbox: string[];
    lat: string; // Nominatim returns string
    lon: string; // Nominatim returns string
    display_name: string;
    class: string;
    type: string;
    importance: number;
    address?: {
        road?: string;
        suburb?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
        [key: string]: string | undefined;
    };
}

export interface UnifiedLocation {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    externalId: string;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

export const searchPlaces = async (query: string): Promise<UnifiedLocation[]> => {
    if (!query || query.length < 3) return [];

    try {
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            addressdetails: '1',
            limit: '5'
        });

        const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.statusText}`);
        }

        const data: LocationResult[] = await response.json();

        return data.map(item => ({
            name: item.display_name.split(',')[0], // Simple heuristic for name
            address: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            externalId: String(item.osm_id)
        }));
    } catch (error) {
        console.error("Error searching places:", error);
        return [];
    }
};
