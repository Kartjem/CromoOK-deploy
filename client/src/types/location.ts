export interface Location {
    id: string;
    title: string;
    description: string;
    address: string;
    price: number;
    area: number;
    images: string[];
    amenities: string[];
    rules: string[];
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    status: 'draft' | 'published' | 'archived';
    shareToken?: string;
    shareAccessLevel?: ShareAccessLevel;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    features?: {
        maxCapacity: number;
        parkingSpots: number;
        equipmentIncluded: boolean;
        accessibility: boolean;
    };
    tags?: string[];
    rating?: number;
    reviews?: number;
    bookings?: {
        totalBookings: number;
        averageRating: number;
    };
    availability?: {
        openTime: string;
        closeTime: string;
        daysAvailable: string[];
    };
    minimumBookingHours?: number;
}

export type ShareAccessLevel = 'photos_only' | 'full_info' | 'admin';

export interface LocationShare {
    id: string;
    locationId: string;
    shareToken: string;
    accessLevel: ShareAccessLevel;
    createdAt: string;
    expiresAt?: string;
    createdBy?: string;
    name?: string;
}

export interface LocationFilter {
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    amenities?: string[];
    minCapacity?: number;
    maxCapacity?: number;
    status?: 'published' | 'draft' | 'archived';
    createdAfter?: string;
    createdBefore?: string;
}

export type CreateLocationDTO = Omit<Location, 'id' | 'createdAt' | 'updatedAt'>;
