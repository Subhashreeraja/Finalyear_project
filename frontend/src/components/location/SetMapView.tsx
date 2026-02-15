import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface SetMapViewProps {
  center: [number, number];
  zoom?: number;
}

/** Updates map view when center/zoom change (e.g. after district/place selection) */
export default function SetMapView({ center, zoom }: SetMapViewProps) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom());
  }, [map, center[0], center[1], zoom]);
  return null;
}
