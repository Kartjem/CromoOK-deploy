import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Star, 
    MapPin, 
    Users, 
    Heart, 
    AreaChart, 
    CalendarClock, 
    ThumbsUp, 
    Edit, 
    EyeOff, 
    Eye,
    MoreHorizontal
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Location } from '@/types/location';
import { useAuthContext } from '@/hooks/useAuthContext';
import { useUpdateLocationStatus } from '@/hooks/useLocations';

interface LocationCardProps {
    location: Location;
}

export function LocationCard({ location }: LocationCardProps) {
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const updateLocationStatus = useUpdateLocationStatus();
    
    const isOwner = user && location.ownerId === user.id;
    const mainImage = location.images[0] || 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=2940&auto=format&fit=crop';

    const handleImageLoad = () => {
        setIsImageLoading(false);
    };

    const handleLocationClick = () => {
        sessionStorage.setItem('locationsScrollPosition', window.scrollY.toString());
    };
    
    const handlePublish = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        updateLocationStatus.mutate(
            { id: location.id, status: 'published' },
            {
                onSuccess: () => {
                    location.status = 'published';
                    window.location.reload();
                }
            }
        );
    };
    
    const handleUnpublish = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        updateLocationStatus.mutate(
            { id: location.id, status: 'draft' },
            {
                onSuccess: () => {
                    location.status = 'draft';
                    window.location.reload();
                }
            }
        );
    };
    
    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/locations/edit/${location.id}`);
    };

    return (
        <Link to={`/locations/${location.id}`} className="block" onClick={handleLocationClick}>
            <Card className="group overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer">
                <div className="relative">
                    <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                        {isImageLoading && (
                            <Skeleton className="absolute inset-0" />
                        )}
                        <img
                            src={mainImage}
                            alt={location.title}
                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={handleImageLoad}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    </div>

                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        {location.features?.equipmentIncluded && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant="secondary" className="bg-card text-card-foreground">
                                            <ThumbsUp className="h-3 w-3 mr-1" />
                                            Equipment Included
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>This location includes all necessary equipment</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {/* {location.status === 'published' && (
                            <Badge className="bg-green-500/90 text-card">
                                Available
                            </Badge>
                        )} */}
                        {location.status === 'draft' && isOwner && (
                            <Badge className="bg-amber-500/90 text-card">
                                Draft
                            </Badge>
                        )}
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-2">
                        {isOwner && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="bg-background/80 backdrop-blur-sm hover:bg-background/100 border-border/50"
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={handleEdit}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    {location.status === 'draft' ? (
                                        <DropdownMenuItem onClick={handlePublish}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Publish
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem onClick={handleUnpublish}>
                                            <EyeOff className="h-4 w-4 mr-2" />
                                            Unpublish
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        
                        <Button
                            variant="outline"
                            size="icon"
                            className={`bg-background/80 backdrop-blur-sm hover:bg-background/100 border-border/50 ${isFavorite ? 'text-red-500 hover:text-red-600' : ' hover:text-foreground'}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsFavorite(!isFavorite);
                            }}
                        >
                            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                            <span className="sr-only">Add to favorites</span>
                        </Button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-background/90 via-background/70 to-transparent">
                        <h3 className="font-semibold text-lg leading-tight mb-1 text-white line-clamp-1">
                            {location.title}
                        </h3>
                        <p className="text-sm text-white/90 flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-1">{location.address}</span>
                        </p>
                    </div>
                </div>

                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        {location.rating ? (
                            <div className="flex items-center gap-1.5">
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`h-4 w-4 ${star <= Math.round(location.rating || 0)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'fill-muted text-muted'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="font-medium text-sm">{location.rating}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground">No reviews yet</span>
                        )}

                        {location.availability?.daysAvailable && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <CalendarClock className="h-3.5 w-3.5" />
                                <span>{location.availability.daysAvailable.length} days/week</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            <span>Up to {location.features?.maxCapacity || 10} people</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <AreaChart className="h-3.5 w-3.5 shrink-0" />
                            <span>{location.area}m²</span>
                        </div>
                    </div>

                    {location.amenities && location.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {location.amenities.slice(0, 3).map((amenity, index) => (
                                <Badge key={index} variant="outline" className="text-xs font-normal text-primary-foreground">
                                    {amenity}
                                </Badge>
                            ))}
                            {location.amenities.length > 3 && (
                                <Badge variant="outline" className="text-xs font-normal text-primary-foreground">
                                    +{location.amenities.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                        {/* <div className="flex flex-col">
                            <span className="text-2xl font-bold text-primary-foreground">{location.price}€</span>
                            <span className="text-sm text-muted-foreground">/hour</span>
                        </div> */}
                        <Button>
                            View Details
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export function LocationCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <div className="relative">
                <div className="aspect-[4/3] relative overflow-hidden">
                    <Skeleton className="absolute inset-0" />
                </div>
            </div>
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-4 w-[70%]" />
                    <Skeleton className="h-4 w-[20%]" />
                </div>
                <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-4 w-[40%]" />
                    <Skeleton className="h-4 w-[30%]" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                    <Skeleton className="h-8 w-[30%]" />
                    <Skeleton className="h-10 w-[30%]" />
                </div>
            </CardContent>
        </Card>
    );
}
