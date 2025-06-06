import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    MapPin,
    Share2,
    Heart,
    Camera,
    Users,
    Shield,
    AlertCircle,
    Edit,
    ChevronRight,
    LayoutGrid,
    Ruler,
    Check,
    X,
    ChevronLeft,
    Lock,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useLocationShareAccess, useLocations } from "@/hooks/useLocations";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShareLocationDialog } from '@/components/locations/share-location-dialog';
import { useAuthContext } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShareAccessLevel } from "@/types/location";
import { useIsMobile } from "@/hooks/use-mobile";
import { LocationsMap } from '@/components/map/locations-map';
import { useState, useEffect } from 'react';
import type { Location as LocationType } from "@/types/location";

export default function LocationDetailsPage() {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const shareToken = searchParams.get('token');
    const accessLevelParam = searchParams.get('access') as ShareAccessLevel | null;
    const initialTab = searchParams.get('tab') || 'details';
    const [activeTab, setActiveTab] = useState(initialTab);

    const { data: location, isLoading } = useLocation(id!, shareToken || undefined);
    const { data: accessLevel } = useLocationShareAccess(id!, shareToken || undefined);
    const { data: allLocations } = useLocations();
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showGallery, setShowGallery] = useState(false);
    const [showFullscreenImage, setShowFullscreenImage] = useState(false);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [showMobileActions, setShowMobileActions] = useState(false);

    const [autoplayPaused, setAutoplayPaused] = useState(false);
    const isMobile = useIsMobile();

    const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null);
    const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
    const [previewPanelClosing, setPreviewPanelClosing] = useState(false);

    const isOwner = Boolean(user && location?.ownerId === user.id);
    const effectiveAccessLevel = isOwner
        ? 'admin' as ShareAccessLevel
        : accessLevel || accessLevelParam || (location?.status === 'published' ? 'full_info' : null);

    const canViewBasicInfo = effectiveAccessLevel === 'full_info' || effectiveAccessLevel === 'admin';
    const canViewDetails = effectiveAccessLevel === 'full_info' || effectiveAccessLevel === 'admin';
    const canEdit = isOwner || effectiveAccessLevel === 'admin';

    useEffect(() => {
        if (autoplayPaused) return;

        const timer = setInterval(() => {
            if (location?.images?.length && !showGallery && !showFullscreenImage) {
                setActiveImageIndex(prev => {
                    if (prev >= Math.min(4, location.images.length - 1)) {
                        return 0;
                    } else {
                        return prev + 1;
                    }
                });
            }
        }, 5000);

        return () => clearInterval(timer);
    }, [location?.images?.length, autoplayPaused, showGallery, showFullscreenImage]);

    const pauseAutoplay = () => setAutoplayPaused(true);
    const resumeAutoplay = () => setAutoplayPaused(false);

    useEffect(() => {
        if (activeTab) {
            searchParams.set('tab', activeTab);
            setSearchParams(searchParams, { replace: true });
        }
    }, [activeTab]);

    useEffect(() => {
        const tabParam = searchParams.get('tab') || 'details';
        if (tabParam !== activeTab) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground">Loading location details...</p>
                </div>
            </div>
        );
    }

    if (!location) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-6 px-4">
                <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-3xl font-semibold text-center">Location not found</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    The location you're looking for may have been removed or doesn't exist.
                </p>
                <Button asChild size="lg" className="mt-4">
                    <Link to="/locations">Browse other locations</Link>
                </Button>
            </div>
        );
    }

    const displayImages = location.images?.length
        ? location.images
        : Array(5).fill('https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=2940&auto=format&fit=crop');

    const navigateImages = (direction: string) => {
        pauseAutoplay();
        if (direction === 'next') {
            setActiveImageIndex(prev =>
                prev === displayImages.length - 1 ? 0 : prev + 1
            );
        } else {
            setActiveImageIndex(prev =>
                prev === 0 ? displayImages.length - 1 : prev - 1
            );
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div
                className="relative w-full rounded-3xl overflow-hidden"
                style={{
                    height: "calc(100vh - 64px)",
                    maxHeight: "75vh",
                    minHeight: "320px"
                }}
                onMouseEnter={pauseAutoplay}
                onMouseLeave={resumeAutoplay}
            >
                <div className="absolute inset-0 overflow-hidden">
                    {displayImages.map((image, idx) => (
                        <img
                            key={idx}
                            src={image}
                            alt={`${location.title} - photo ${idx + 1}`}
                            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${activeImageIndex === idx ? "opacity-100 z-10" : "opacity-0 z-0"
                                }`}
                        />
                    ))}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors z-20"
                    onClick={() => navigateImages('prev')}
                    aria-label="Previous image"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>

                <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors z-20"
                    onClick={() => navigateImages('next')}
                    aria-label="Next image"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>

                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-6 left-6 rounded-full shadow-lg bg-background/80 backdrop-blur-md z-20"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full shadow-lg bg-background/80 backdrop-blur-md"
                        onClick={() => setShowGallery(true)}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    {isMobile ? (
                        <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full shadow-lg bg-background/80 backdrop-blur-md"
                            onClick={() => setShowMobileActions(prev => !prev)}
                        >
                            <AlertCircle className="h-4 w-4" />
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-full shadow-lg bg-background/80 backdrop-blur-md"
                                onClick={() => setIsShareDialogOpen(true)}
                                title="Share location"
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="rounded-full shadow-lg bg-background/80 backdrop-blur-md"
                                    onClick={() => navigate(`/locations/edit/${location.id}`)}
                                    title="Edit location"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-full shadow-lg bg-background/80 backdrop-blur-md"
                            >
                                <Heart className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>

                {isMobile && showMobileActions && (
                    <div className="absolute top-20 right-6 bg-background/95 backdrop-blur-md shadow-lg rounded-xl p-2 z-30 w-40">
                        <div className="flex flex-col">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start py-2"
                                onClick={() => {
                                    setIsShareDialogOpen(true);
                                    setShowMobileActions(false);
                                }}
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                <span>Share</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="justify-start py-2">
                                <Heart className="h-4 w-4 mr-2" />
                                <span>Save</span>
                            </Button>
                            {canEdit && (
                                <>
                                    <Separator className="my-1" />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="justify-start py-2 text-red-500 hover:text-red-600 hover:bg-red-100/10"
                                        onClick={() => {
                                            navigate(`/locations/edit/${location.id}`);
                                            setShowMobileActions(false);
                                        }}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        <span>Edit</span>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-6 right-6 rounded-lg shadow-lg bg-background/80 backdrop-blur-md gap-2 z-20"
                    onClick={() => {
                        setShowFullscreenImage(true);
                        pauseAutoplay();
                    }}
                >
                    <Camera className="h-4 w-4" />
                    <span>View photo</span>
                </Button>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {displayImages.slice(0, 5).map((_, idx) => (
                        <button
                            key={idx}
                            className={`w-10 h-1.5 rounded-full transition-all ${activeImageIndex === idx
                                ? "bg-white"
                                : "bg-white/40 hover:bg-white/60"
                                }`}
                            onClick={() => {
                                setActiveImageIndex(idx);
                                pauseAutoplay();
                            }}
                            aria-label={`View image ${idx + 1}`}
                        />
                    ))}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10 z-10">
                    <div className="max-w-4xl">
                        {canViewBasicInfo ? (
                            <>
                                {/* <Badge className="mb-3 bg-primary/90 hover:bg-primary text-white">
                                    {location.status === "published" ? "Available" : location.status}
                                </Badge> */}
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold  mb-3 leading-tight">
                                    {location.title}
                                </h1>
                                <div className="flex items-center gap-2 ">
                                    <MapPin className="h-4 w-4" />
                                    <span className="font-medium">{location.address}</span>
                                </div>
                            </>
                        ) : (
                            <div className="bg-black/40 backdrop-blur-sm p-4 rounded-lg inline-flex items-center">
                                <Lock className="h-5 w-5 text-amber-400 mr-2" />
                                <span className="text-white font-medium">Limited access view - Photos only</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="order-1 lg:order-2 lg:col-span-3">
                        {effectiveAccessLevel === 'photos_only' && (
                            <Card className="mb-6 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <Eye className="h-5 w-5 text-amber-500" />
                                    <div>
                                        <h3 className="font-medium">Limited access mode</h3>
                                        <p className="text-sm text-muted-foreground">
                                            You have read-only access to view photos of this location.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {canViewBasicInfo && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8 lg:mb-10">
                                <Card className="border-0 shadow-none bg-muted/20">
                                    <CardContent className={`p-3 sm:p-4 md:p-6 ${isMobile ? 'flex flex-row items-center' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 md:p-2.5 rounded-full bg-primary/10 text-primary">
                                                <Users className="h-4 w-4 md:h-5 md:w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Capacity</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground">
                                                    Up to {location.features?.maxCapacity || 10} people
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-none bg-muted/20">
                                    <CardContent className={`p-3 sm:p-4 md:p-6 ${isMobile ? 'flex flex-row items-center' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 md:p-2.5 rounded-full bg-primary/10 text-primary">
                                                <Ruler className="h-4 w-4 md:h-5 md:w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Space</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground">
                                                    {location.area}m² area
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-none bg-muted/20">
                                    <CardContent className={`p-3 sm:p-4 md:p-6 ${isMobile ? 'flex flex-row items-center' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 md:p-2.5 rounded-full bg-primary/10 text-primary">
                                                <Shield className="h-4 w-4 md:h-5 md:w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Verified</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground">
                                                    Qualified location
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {canViewDetails ? (
                            <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue={initialTab} className="w-full mb-10 text-muted-foreground">
                                <TabsList className={`mb-6 ${isMobile ? 'w-full grid grid-cols-4' : ''}`}>
                                    <TabsTrigger value="details" className={isMobile ? 'text-xs' : ''}>Details</TabsTrigger>
                                    <TabsTrigger value="amenities" className={isMobile ? 'text-xs' : ''}>Amenities</TabsTrigger>
                                    <TabsTrigger value="rules" className={isMobile ? 'text-xs' : ''}>Rules</TabsTrigger>
                                    <TabsTrigger value="map" className={isMobile ? 'text-xs' : ''}>Map</TabsTrigger>
                                </TabsList>

                                <TabsContent value="details" className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold mb-4">About this location</h2>
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <p className="text-muted-foreground whitespace-pre-line">
                                                {location.description}
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="amenities">
                                    <h2 className="text-2xl font-semibold mb-6">What this place offers</h2>
                                    {location.amenities?.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                            {location.amenities.map((amenity, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <Check className="h-4 w-4 text-primary" />
                                                    <span>{amenity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No amenities listed for this location.</p>
                                    )}
                                </TabsContent>

                                <TabsContent value="rules">
                                    <h2 className="text-2xl font-semibold mb-6">Location rules</h2>
                                    {location.rules?.length > 0 ? (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {location.rules.map((rule, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <div className="p-1.5 rounded-full bg-muted">
                                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <span>{rule}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No specific rules for this location.</p>
                                    )}
                                </TabsContent>

                                <TabsContent value="map">
                                    <h2 className="text-2xl font-semibold mb-6">Location on map</h2>
                                    {location.coordinates && allLocations ? (
                                        <div className="relative w-full h-[500px] rounded-xl overflow-hidden">
                                            <LocationsMap
                                                locations={allLocations.filter(l => l.coordinates)}
                                                onLocationClick={(loc: LocationType) => {
                                                    if (loc.id === location.id) return;
                                                    setSelectedLocation(loc);
                                                    setIsLocationSheetOpen(true);
                                                }}
                                                center={{
                                                    latitude: location.coordinates.latitude,
                                                    longitude: location.coordinates.longitude,
                                                    zoom: 15
                                                }}
                                                className="w-full h-full"
                                            />
                                            {isLocationSheetOpen && selectedLocation && (
                                                <>
                                                    <div
                                                        className="absolute inset-0 z-20 bg-black/80 cursor-pointer transition-opacity duration-500"
                                                        onClick={() => {
                                                            setPreviewPanelClosing(true);
                                                            setTimeout(() => {
                                                                setIsLocationSheetOpen(false);
                                                                setPreviewPanelClosing(false);
                                                            }, 400);
                                                        }}
                                                        aria-label="Close location preview"
                                                    />
                                                    <div
                                                        className={`absolute top-0 right-0 h-full max-w-[400px] w-full sm:w-[350px] bg-background shadow-xl border-l border-border z-30 ${previewPanelClosing ? 'preview-slide-out' : 'preview-slide-in'}`}
                                                        style={{ boxShadow: '0 0 32px 0 rgba(0,0,0,0.10)' }}
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <div className="p-5 flex flex-col h-full">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <h3 className="text-lg font-semibold text-primary-foreground mb-1">{selectedLocation.title}</h3>
                                                                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                                                        <MapPin className="h-4 w-4" />
                                                                        {selectedLocation.address}
                                                                    </div>
                                                                </div>
                                                                <Button variant="ghost" size="icon" onClick={() => {
                                                                    setPreviewPanelClosing(true);
                                                                    setTimeout(() => {
                                                                        setIsLocationSheetOpen(false);
                                                                        setPreviewPanelClosing(false);
                                                                    }, 400);
                                                                }}>
                                                                    <X className="h-5 w-5" />
                                                                </Button>
                                                            </div>
                                                            <div className="aspect-video rounded-md overflow-hidden mb-4">
                                                                <img
                                                                    src={selectedLocation.images[0] || 'https://via.placeholder.com/800x600'}
                                                                    alt={selectedLocation.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="space-y-3 flex-1 overflow-y-auto">
                                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                                    {selectedLocation.description}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center justify-between pt-4 border-t mt-4">
                                                                <Button variant="outline" onClick={() => {
                                                                    setPreviewPanelClosing(true);
                                                                    setTimeout(() => {
                                                                        setIsLocationSheetOpen(false);
                                                                        setPreviewPanelClosing(false);
                                                                    }, 400);
                                                                }}>
                                                                    Close
                                                                </Button>
                                                                <Button onClick={() => {
                                                                    setPreviewPanelClosing(true);
                                                                    setTimeout(() => {
                                                                        setIsLocationSheetOpen(false);
                                                                        setPreviewPanelClosing(false);
                                                                        navigate(`/locations/${selectedLocation.id}?tab=details`);
                                                                    }, 400);
                                                                }}>
                                                                    View Details
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <style>{`
                                                    .preview-slide-in {
                                                      animation: previewSlideIn 0.5s cubic-bezier(.4,0,.2,1);
                                                    }
                                                    @keyframes previewSlideIn {
                                                      from { transform: translateX(100%); opacity: 0.7; }
                                                      to { transform: translateX(0); opacity: 1; }
                                                    }
                                                    .preview-slide-out {
                                                      animation: previewSlideOut 0.4s cubic-bezier(.4,0,.2,1) forwards;
                                                    }
                                                    @keyframes previewSlideOut {
                                                      from { transform: translateX(0); opacity: 1; }
                                                      to { transform: translateX(100%); opacity: 0.7; }
                                                    }
                                                    `}</style>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">Map location not available.</p>
                                    )}
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <Card className="mb-10">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-center flex-col space-y-3 py-8">
                                        <Lock className="h-10 w-10 text-muted-foreground/50" />
                                        <h3 className="text-xl font-medium">Location Details Hidden</h3>
                                        <p className="text-muted-foreground text-center max-w-xs">
                                            Detailed information about this location is not available with your current access level.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="mt-8 lg:mt-10">
                            <h2 className="text-xl lg:text-2xl text-muted-foreground font-semibold mb-4 lg:mb-6">
                                {canViewBasicInfo ? 'Gallery' : 'Photos'}
                            </h2>
                            <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 md:grid-cols-3 gap-3'}`}>
                                {displayImages.slice(0, isMobile ? 4 : 6).map((image, idx) => (
                                    <div
                                        key={idx}
                                        className="relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group"
                                        onClick={() => {
                                            setActiveImageIndex(idx);
                                            setShowFullscreenImage(true);
                                        }}
                                    >
                                        <img
                                            src={image}
                                            alt={canViewBasicInfo ? `${location.title} - photo ${idx + 1}` : `Photo ${idx + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                ))}

                                {displayImages.length > (isMobile ? 4 : 6) && (
                                    <Button
                                        variant="outline"
                                        className="flex items-center justify-center gap-2 aspect-[4/3]"
                                        onClick={() => setShowGallery(true)}
                                    >
                                        <Camera className="h-4 w-4 mr-1 text-muted-foreground" />
                                        <span className={`text-muted-foreground ${isMobile ? 'text-xs' : ''}`}>
                                            {isMobile ? `+${displayImages.length - 4} photos` : `View all ${displayImages.length} photos`}
                                        </span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Fullscreen image */}
            {showFullscreenImage && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col">
                    <div className="p-4 flex items-center justify-between text-white/90 bg-black/50">
                        <h3 className="font-medium">
                            {canViewBasicInfo
                                ? `${location.title} - Photo ${activeImageIndex + 1} of ${displayImages.length}`
                                : `Photo ${activeImageIndex + 1} of ${displayImages.length}`}
                        </h3>
                        <Button variant="ghost" size="icon" className="text-white hover:text-white/80" onClick={() => setShowFullscreenImage(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex-1 relative">
                        <img
                            src={displayImages[activeImageIndex]}
                            alt={canViewBasicInfo
                                ? `${location.title} - photo ${activeImageIndex + 1}`
                                : `Photo ${activeImageIndex + 1}`}
                            className="absolute inset-0 w-full h-full object-contain"
                        />

                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                            onClick={() => navigateImages('prev')}
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>

                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                            onClick={() => navigateImages('next')}
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Gallery for viewing all images */}
            {showGallery && (
                <div className="fixed inset-0 bg-background z-50 flex flex-col">
                    <div className="p-4 flex items-center justify-between border-b">
                        <h3 className="font-medium">Gallery - {displayImages.length} photos</h3>
                        <Button variant="ghost" size="icon" onClick={() => setShowGallery(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {displayImages.map((image, idx) => (
                                <div
                                    key={idx}
                                    className="relative rounded-md overflow-hidden cursor-pointer group flex items-center justify-center bg-muted/10"
                                    style={{ height: "300px" }}
                                    onClick={() => {
                                        setActiveImageIndex(idx);
                                        setShowGallery(false);
                                        setShowFullscreenImage(true);
                                    }}
                                >
                                    <img
                                        src={image}
                                        alt={`Gallery image ${idx + 1}`}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-black/60 px-3 py-1.5 rounded-md text-white text-sm">
                                            View full size
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}

            {/* Share link dialog */}
            <ShareLocationDialog
                isOpen={isShareDialogOpen}
                onClose={() => setIsShareDialogOpen(false)}
                locationId={location.id}
                locationTitle={location.title}
            />
        </div>
    );
}