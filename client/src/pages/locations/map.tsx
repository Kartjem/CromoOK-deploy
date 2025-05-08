import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocations } from '@/hooks/useLocations';
import { LocationsMap } from '@/components/map/locations-map';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import type { Location } from '@/types/location';

export default function LocationsMapPage() {
    const { data: locations, isLoading } = useLocations();
    const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
    const navigate = useNavigate();

    const [mapCenter, setMapCenter] = useState({
        latitude: 59.436962,
        longitude: 24.753574,
        zoom: 11
    });

    useEffect(() => {
        if (locations) {
            const filtered = locations.filter(loc => loc.status === 'published');
            setFilteredLocations(filtered);

            if (!selectedLocation && filtered.length > 0) {
                const locationWithCoords = filtered.find(loc => loc.coordinates);
                if (locationWithCoords && locationWithCoords.coordinates) {
                    setMapCenter({
                        latitude: locationWithCoords.coordinates.latitude,
                        longitude: locationWithCoords.coordinates.longitude,
                        zoom: 11
                    });
                }
            }
        }
    }, [locations, selectedLocation]);

    const handleLocationClick = (location: Location) => {
        if (location.coordinates) {
            setSelectedLocation(location);
            setIsLocationSheetOpen(true);

            setMapCenter({
                latitude: location.coordinates.latitude,
                longitude: location.coordinates.longitude,
                zoom: 14
            });
        }
    };

    const handleViewDetails = (locationId: string) => {
        navigate(`/locations/${locationId}`);
    };

    const handleCloseLocationSheet = () => {
        setIsLocationSheetOpen(false);
        setSelectedLocation(null);
    };

    return (
        <div className="container relative py-8">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight text-muted-foreground">Locations on Map</h1>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">Loading locations...</p>
                    </div>
                ) : filteredLocations.length > 0 ? (
                    <LocationsMap
                        locations={filteredLocations}
                        onLocationClick={handleLocationClick}
                        center={mapCenter}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="bg-muted/50 rounded-full p-4 mb-4">
                            <MapPin className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-1">No Locations Found</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            There are no available locations to display on the map.
                        </p>
                    </div>
                )}

                <Sheet open={isLocationSheetOpen} onOpenChange={setIsLocationSheetOpen}>
                    <SheetContent side="right" className="sm:max-w-lg">
                        {selectedLocation && (
                            <>
                                <SheetHeader>
                                    <SheetTitle className="text-primary-foreground">{selectedLocation.title}</SheetTitle>
                                    <SheetDescription className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {selectedLocation.address}
                                    </SheetDescription>
                                </SheetHeader>

                                <div className="py-6">
                                    <div className="aspect-video rounded-md overflow-hidden mb-4">
                                        <img
                                            src={selectedLocation.images[0] || 'https://via.placeholder.com/800x600'}
                                            alt={selectedLocation.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        {selectedLocation.tags && selectedLocation.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {selectedLocation.tags.map((tag, i) => (
                                                    <Badge key={i} variant="secondary" className="text-foreground bg-secondary hover:bg-secondary/80">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                                            {selectedLocation.description}
                                        </p>

                                        {selectedLocation.amenities && selectedLocation.amenities.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Amenities:</h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedLocation.amenities.slice(0, 4).map((amenity, i) => (
                                                        <Badge key={i} variant="outline" className="text-muted-foreground border-border">
                                                            {amenity}
                                                        </Badge>
                                                    ))}
                                                    {selectedLocation.amenities.length > 4 && (
                                                        <Badge variant="outline" className="text-muted-foreground border-border">
                                                            +{selectedLocation.amenities.length - 4}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-4 border-t">
                                            <div>
                                                <span className="font-bold text-2xl text-primary-foreground">{selectedLocation.price}€</span>
                                                <span className="text-sm text-muted-foreground">/hour</span>
                                            </div>
                                            <div className="flex gap-2 text-muted-foreground">
                                                <Button variant="outline" onClick={handleCloseLocationSheet}>
                                                    Close
                                                </Button>
                                                <Button onClick={() => handleViewDetails(selectedLocation.id)}>
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}