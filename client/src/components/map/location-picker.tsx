import { useEffect, useRef, useState } from 'react';
import { MapView } from './map-view';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
    onLocationSelect?: (location: {
        address: string;
        coordinates: { latitude: number; longitude: number };
    }) => void;
    defaultAddress?: string;
    updateAddressOnClick?: boolean;
    className?: string;
}

export function LocationPicker({
    onLocationSelect,
    defaultAddress,
    updateAddressOnClick = false,
    className
}: LocationPickerProps) {
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number }>({
        latitude: 59.437,
        longitude: 24.745
    });
    const [address, setAddress] = useState<string>(defaultAddress || '');
    const geocoderContainer = useRef<HTMLDivElement>(null);

    const isGoogleLoaded = typeof window !== 'undefined' && !!window.google && !!window.google.maps;
    if (!isGoogleLoaded) {
        return (
            <div className={className + " flex items-center justify-center bg-muted/30"}>
                <span className="text-muted-foreground">Loading Maps...</span>
            </div>
        );
    }

    useEffect(() => {
        if (!geocoderContainer.current) return;

        const geocoder = new google.maps.Geocoder();

        if (defaultAddress) {
            geocoder.geocode({ address: defaultAddress }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const { lat, lng } = results[0].geometry.location;
                    setCoordinates({ latitude: lat(), longitude: lng() });
                    setAddress(results[0].formatted_address);
                    onLocationSelect?.({
                        address: results[0].formatted_address,
                        coordinates: { latitude: lat(), longitude: lng() }
                    });
                }
            });
        }

        return () => {
        };
    }, [defaultAddress]);

    const handleMapClick = (lngLat: { lng: number; lat: number }) => {
        setCoordinates({ latitude: lngLat.lat, longitude: lngLat.lng });

        if (updateAddressOnClick) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat: lngLat.lat, lng: lngLat.lng } }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    setAddress(results[0].formatted_address);
                    onLocationSelect?.({
                        address: results[0].formatted_address,
                        coordinates: { latitude: lngLat.lat, longitude: lngLat.lng }
                    });
                }
            });
        } else {
            onLocationSelect?.({
                address: address || defaultAddress || '',
                coordinates: { latitude: lngLat.lat, longitude: lngLat.lng }
            });
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="space-y-2">
                <Label htmlFor="location-search">Location</Label>
                <div
                    ref={geocoderContainer}
                    id="location-search"
                    className="geocoder"
                />
                {address && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{address}</span>
                    </div>
                )}
            </div>

            <Card className="border rounded-md overflow-hidden">
                <CardContent className="p-0">
                    <MapView
                        latitude={coordinates.latitude}
                        longitude={coordinates.longitude}
                        onMapClick={handleMapClick}
                        zoom={13}
                        className="rounded-none border-0 h-[350px] shadow-none"
                    />
                </CardContent>
            </Card>
        </div>
    );
}