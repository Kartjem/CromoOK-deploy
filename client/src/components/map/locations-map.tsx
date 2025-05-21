declare global {
    interface Window {
        google: any;
    }
}

import { useEffect, useRef } from 'react';
import type { Location } from '@/types/location';

interface LocationsMapProps {
    locations: Location[];
    onLocationClick: (location: Location) => void;
    className?: string;
    center: {
        latitude: number;
        longitude: number;
        zoom: number;
    };
}

export function LocationsMap({
    locations,
    onLocationClick,
    className = "w-full h-[70vh] rounded-lg border shadow-sm",
    center
}: LocationsMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<any[]>([]);
    const mapInstanceRef = useRef<any>(null);
    const userInteracted = useRef(false);

    useEffect(() => {
        if (!mapRef.current) return;
        if (!window.google || !window.google.maps) return;

        if (!mapInstanceRef.current) {
            mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                center: { lat: center.latitude, lng: center.longitude },
                zoom: center.zoom,
                mapId: 'DEMO_MAP_ID',
                disableDefaultUI: false,
            });
            mapInstanceRef.current.addListener('dragstart', () => { userInteracted.current = true; });
            mapInstanceRef.current.addListener('zoom_changed', () => { userInteracted.current = true; });
        }
        markersRef.current.forEach(marker => marker.map = null);
        markersRef.current = [];
        locations.forEach(location => {
            if (!location.coordinates) return;
            const marker = new window.google.maps.marker.AdvancedMarkerElement({
                position: { lat: location.coordinates.latitude, lng: location.coordinates.longitude },
                map: mapInstanceRef.current!,
                title: location.title,
            });
            marker.addListener('gmp-click', () => {
                onLocationClick(location);
            });
            markersRef.current.push(marker);
        });
    }, []);

    return (
        <div ref={mapRef} className={className} style={{ minHeight: 400, height: '100%' }} />
    );
}
