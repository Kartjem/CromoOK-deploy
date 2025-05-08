import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    MapPin,
    Clock,
    Share2,
    Heart,
    Camera,
    Users,
    Shield,
    AlertCircle,
    CalendarRange,
    Edit,
    Info,
    ChevronRight,
    LayoutGrid,
    Ruler,
    Check,
    X,
    ChevronLeft,
    MinusCircle,
    PlusCircle,
    EyeOff,
    Link2,
    Lock,
    Eye} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useUpdateLocationStatus, useLocationShareAccess } from "@/hooks/useLocations";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MapView } from '@/components/map/map-view';
import { DeleteLocationDialog } from '@/components/locations/delete-location-dialog';
import { ShareLocationDialog } from '@/components/locations/share-location-dialog';
import { useAuthContext } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShareAccessLevel } from "@/types/location";
import { useIsMobile } from "@/hooks/use-mobile";

export default function LocationDetailsPage() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const shareToken = searchParams.get('token');
    const accessLevelParam = searchParams.get('access') as ShareAccessLevel | null;

    const { data: location, isLoading } = useLocation(id!, shareToken || undefined);
    const { data: accessLevel } = useLocationShareAccess(id!, shareToken || undefined);
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showGallery, setShowGallery] = useState(false);
    const [showFullscreenImage, setShowFullscreenImage] = useState(false);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [showMobileActions, setShowMobileActions] = useState(false);

    const [bookingHours, setBookingHours] = useState(2);

    const [autoplayPaused, setAutoplayPaused] = useState(false);
    const updateLocationStatus = useUpdateLocationStatus();
    const isMobile = useIsMobile();


    const isOwner = Boolean(user && location?.ownerId === user.id);
    const effectiveAccessLevel = isOwner
        ? 'admin' as ShareAccessLevel
        : accessLevel || accessLevelParam || (location?.status === 'published' ? 'full_info' : null);

    const canViewBasicInfo = effectiveAccessLevel === 'full_info' || effectiveAccessLevel === 'admin';
    const canViewDetails = effectiveAccessLevel === 'full_info' || effectiveAccessLevel === 'admin';
    const canViewPrice = effectiveAccessLevel === 'full_info' || effectiveAccessLevel === 'admin';
    const canEdit = isOwner || effectiveAccessLevel === 'admin';

    useEffect(() => {
        if (location?.minimumBookingHours) {
            setBookingHours(location.minimumBookingHours);
        }
    }, [location]);

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
            {/* Full-width hero area with main image and title overlay */}
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

                {/* Gradient overlay with enhanced aesthetic */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Image navigation controls */}
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

                {/* Back button */}
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-6 left-6 rounded-full shadow-lg bg-background/80 backdrop-blur-md z-20"
                    onClick={() => window.history.back()}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                {/* Action buttons */}
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
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
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

                {/* Mobile actions dropdown */}
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

                {/* Fullscreen action */}
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

                {/* Image gallery indicators */}
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

                {/* Title container with improved styling */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10 z-10">
                    <div className="max-w-4xl">
                        {canViewBasicInfo ? (
                            <>
                                <Badge className="mb-3 bg-primary/90 hover:bg-primary text-white">
                                    {location.status === "published" ? "Available" : location.status}
                                </Badge>
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                                    {location.title}
                                </h1>
                                <div className="flex items-center gap-2 text-white/90">
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
                    <div className="order-2 lg:order-1">
                        <div className="sticky top-6 space-y-4 lg:space-y-6">
                            {canViewPrice ? (
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-baseline justify-between mb-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-bold">{location.price}€</span>
                                                <span className="text-muted-foreground text-lg">/hour</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                <span>Min {location.minimumBookingHours || 2}h</span>
                                            </div>
                                        </div>

                                        {/* Booking form */}
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button variant="outline" className="h-14 text-left justify-start p-3">
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-xs text-muted-foreground">Date</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <CalendarRange className="h-4 w-4" />
                                                            <span>Select date</span>
                                                        </div>
                                                    </div>
                                                </Button>

                                                <Button variant="outline" className="h-14 text-left justify-start p-3">
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-xs text-muted-foreground">Time</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <Clock className="h-4 w-4" />
                                                            <span>Select time</span>
                                                        </div>
                                                    </div>
                                                </Button>
                                            </div>

                                            <div className="flex items-center justify-between p-3 border rounded-md h-14">
                                                <div className="flex flex-col items-start">
                                                    <span className="text-xs text-muted-foreground">Duration</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{bookingHours} hours</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            const minHours = location.minimumBookingHours || 2;
                                                            if (bookingHours > minHours) {
                                                                setBookingHours(bookingHours - 1);
                                                            }
                                                        }}
                                                        disabled={bookingHours <= (location.minimumBookingHours || 2)}
                                                    >
                                                        <MinusCircle className="h-5 w-5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setBookingHours(bookingHours + 1)}
                                                    >
                                                        <PlusCircle className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <Button variant="outline" className="w-full h-14 text-left justify-start p-3">
                                                <div className="flex flex-col items-start">
                                                    <span className="text-xs text-muted-foreground">Guests</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Users className="h-4 w-4" />
                                                        <span>Number of people</span>
                                                    </div>
                                                </div>
                                            </Button>
                                        </div>

                                        <Separator className="my-6" />

                                        {/* Price breakdown */}
                                        <div className="space-y-3 mb-6">
                                            <div className="flex justify-between">
                                                <span>{location.price}€ × {bookingHours} hours</span>
                                                <span>{location.price * bookingHours}€</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Service fee</span>
                                                <span>{Math.round(location.price * bookingHours * 0.1)}€</span>
                                            </div>
                                            <Separator className="my-2" />
                                            <div className="flex justify-between font-semibold">
                                                <span>Total</span>
                                                <span>{location.price * bookingHours + Math.round(location.price * bookingHours * 0.1)}€</span>
                                            </div>
                                        </div>

                                        <Button className="w-full" size="lg">Book now</Button>
                                    </CardContent>
                                    <div className="p-4 border-t bg-muted/20">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-muted-foreground">
                                                You won't be charged yet
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            ) : (
                                <Card className="p-6">
                                    <div className="flex items-center justify-center flex-col space-y-3 py-8">
                                        <Lock className="h-10 w-10 text-muted-foreground/50" />
                                        <h3 className="text-xl font-medium">Pricing Information Hidden</h3>
                                        <p className="text-muted-foreground text-center max-w-xs">
                                            Pricing and booking details for this location are not available with your current access level.
                                        </p>
                                    </div>
                                </Card>
                            )}

                            {canEdit && (
                                <Card>
                                    <CardContent className="p-6">
                                        <h2 className="text-base font-semibold mb-4">Location management</h2>
                                        <div className="flex flex-col gap-3">
                                            <Button
                                                variant="outline"
                                                className="flex items-center justify-center gap-2 w-full"
                                                onClick={() => navigate(`/locations/edit/${location.id}`)}
                                            >
                                                <Edit className="h-4 w-4" />
                                                Edit Location
                                            </Button>

                                            {location.status === 'draft' ? (
                                                <Button
                                                    variant="outline"
                                                    className="flex items-center justify-center gap-2 w-full"
                                                    onClick={() => {
                                                        updateLocationStatus.mutate(
                                                            { id: location.id, status: 'published' },
                                                            {
                                                                onSuccess: () => {
                                                                    window.location.reload();
                                                                }
                                                            }
                                                        );
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Publish Location
                                                </Button>
                                            ) : location.status === 'published' && (
                                                <Button
                                                    variant="outline"
                                                    className="flex items-center justify-center gap-2 w-full"
                                                    onClick={() => {
                                                        updateLocationStatus.mutate(
                                                            { id: location.id, status: 'draft' },
                                                            {
                                                                onSuccess: () => {
                                                                    window.location.reload();
                                                                }
                                                            }
                                                        );
                                                    }}
                                                >
                                                    <EyeOff className="h-4 w-4" />
                                                    Unpublish Location
                                                </Button>
                                            )}

                                            <Button
                                                variant="outline"
                                                className="flex items-center justify-center gap-2 w-full"
                                                onClick={() => setIsShareDialogOpen(true)}
                                            >
                                                <Link2 className="h-4 w-4" />
                                                Share link
                                            </Button>

                                            <DeleteLocationDialog
                                                locationId={location.id}
                                                locationTitle={location.title}
                                                isOwner={isOwner}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Main content middle section */}
                    <div className="order-1 lg:order-2 lg:col-span-2">
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
                            <Tabs defaultValue="details" className="w-full mb-10 text-muted-foreground">
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
                                    {location.coordinates ? (
                                        <MapView
                                            latitude={location.coordinates.latitude}
                                            longitude={location.coordinates.longitude}
                                            zoom={15}
                                            interactive={true}
                                            className="w-full h-[500px] rounded-xl overflow-hidden"
                                        />
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
            {/* Mobile bottom action bar - only show if price is viewable */}
            {canViewPrice && isMobile && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-40 flex items-center justify-between">
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold">{location.price}€</span>
                            <span className="text-muted-foreground">/hour</span>
                        </div>
                    </div>
                    <Button
                        size="lg"
                        onClick={() => {
                            window.scrollTo({
                                top: 0,
                                behavior: 'smooth'
                            });
                            document.body.style.paddingBottom = '80px';
                        }}
                    >
                        Book now
                    </Button>
                </div>
            )}

            {isMobile && canViewPrice && (
                <div className="h-20 lg:h-0"></div>
            )}

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
            {location.shareToken && (
                <ShareLocationDialog
                    isOpen={isShareDialogOpen}
                    onClose={() => setIsShareDialogOpen(false)}
                    locationId={location.id}
                    locationTitle={location.title}
                />
            )}
        </div>
    );
}