/** Crowd level for zone status (Green / Yellow / Red) */
export type CrowdLevel = 'low' | 'moderate' | 'high';

export interface District {
  id: string;
  name: string;
  lat: number;
  lng: number;
  placeCount: number;
}

export interface Place {
  id: string;
  districtId: string;
  name: string;
  type: 'railway_station' | 'bus_stand' | 'temple' | 'market' | 'mall';
  lat: number;
  lng: number;
  address?: string;
}

export interface Zone {
  id: string;
  placeId: string;
  name: string;
  order: 1 | 2 | 3;
  polygon: [number, number][]; // lat,lng pairs for geo-fence
  crowdLevel: CrowdLevel;
  crowdCount?: number;
  capacity?: number;
}

export interface ZoneStatus {
  zoneId: string;
  zoneName: string;
  crowdLevel: CrowdLevel;
  crowdCount: number;
  capacity: number;
  updatedAt: string;
}
