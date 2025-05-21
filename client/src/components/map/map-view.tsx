import { useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Location } from '@/types/location';

interface MapViewProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  interactive?: boolean;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  className?: string;
  locations?: Location[];
  onMarkerClick?: (location: Location) => void;
}

export function MapView({
  latitude,
  longitude,
  zoom = 13,
  interactive = true,
  onMapClick,
  className = "w-full h-[300px] rounded-lg overflow-hidden",
  locations,
  onMarkerClick
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.Marker | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const isMobile = useIsMobile();
  const userInteracted = useRef(false);

  const isGoogleLoaded = typeof window !== 'undefined' && !!window.google && !!window.google.maps;

  if (!isGoogleLoaded) {
    return (
      <div className={className + " flex items-center justify-center bg-muted/30"}>
        <span className="text-muted-foreground">Загрузка карты Google...</span>
      </div>
    );
  }

  useEffect(() => {
    if (!mapContainer.current) return;
    const mapOptions: google.maps.MapOptions = {
      center: { lat: latitude, lng: longitude },
      zoom: zoom,
      disableDefaultUI: !interactive,
      gestureHandling: isMobile ? 'cooperative' : 'auto'
    };
    map.current = new google.maps.Map(mapContainer.current, mapOptions);

    map.current.addListener('dragstart', () => { userInteracted.current = true; });
    map.current.addListener('zoom_changed', () => { userInteracted.current = true; });

    if (onMapClick) {
      map.current.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          onMapClick?.({ lng: e.latLng.lng(), lat: e.latLng.lat() });
        }
      });
    }

    if (locations && locations.length > 0) {
      markersRef.current = locations.map(loc => {
        if (!loc.coordinates) return null;
        const markerOptions: google.maps.MarkerOptions = {
          position: { lat: loc.coordinates.latitude, lng: loc.coordinates.longitude },
          map: map.current!,
          title: loc.title,
          icon: {
            url: loc.images?.[0] || 'https://via.placeholder.com/150',
            scaledSize: new google.maps.Size(48, 48),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(24, 24)
          }
        };
        const marker = new google.maps.Marker(markerOptions);
        if (onMarkerClick) {
          marker.addListener('click', () => onMarkerClick(loc));
        }
        return marker;
      }).filter(Boolean) as google.maps.Marker[];
    } else {
      marker.current = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map.current!
      });
    }

    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      if (marker.current) {
        marker.current.setMap(null);
        marker.current = null;
      }
      if (map.current) {
        google.maps.event.clearInstanceListeners(map.current);
      }
    };
  }, []);


  return <div ref={mapContainer} className={className} />;
}