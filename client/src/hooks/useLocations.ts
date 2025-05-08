import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabaseClient';
import type { Location, LocationFilter, CreateLocationDTO, ShareAccessLevel, LocationShare } from '@/types/location';
import { useAuthContext } from '@/context/AuthContext';
import { deleteImage, uploadImagesFromUrls } from '@/lib/imageService';
import { setDemoLocations, migrateDemoLocationsToSupabase } from '@/utils/migrationUtils';

export const DEMO_LOCATIONS: Location[] = [
];

setDemoLocations(DEMO_LOCATIONS);

const CREATED_LOCATIONS_KEY = 'user-created-locations';

export async function migrateAllDemoLocationsToSupabase(forceUpdate = false) {
    return migrateDemoLocationsToSupabase(forceUpdate);
}

export function useLocations(filters?: LocationFilter, includeUserDrafts: boolean = false) {
    const { user } = useAuthContext();

    return useQuery({
        queryKey: ['locations', filters, includeUserDrafts],
        queryFn: async () => {
            try {
                let query = supabase.from('locations').select('*');

                if (filters) {
                    if (filters.minPrice !== undefined) {
                        query = query.gte('price', filters.minPrice);
                    }
                    if (filters.maxPrice !== undefined) {
                        query = query.lte('price', filters.maxPrice);
                    }
                    if (filters.minArea !== undefined) {
                        query = query.gte('area', filters.minArea);
                    }
                    if (filters.maxArea !== undefined) {
                        query = query.lte('area', filters.maxArea);
                    }
                }

                if (!includeUserDrafts) {
                    query = query.eq('status', 'published');
                }

                const { data, error } = await query
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching locations from Supabase:', error);
                } else if (data && data.length > 0) {
                    console.log('Got locations from Supabase:', data);

                    const mappedData = data.map(loc => ({
                        ...loc,
                        ownerId: loc.owner_id,
                        createdAt: loc.created_at,
                        updatedAt: loc.updated_at,
                        minimumBookingHours: loc.minimum_booking_hours
                    }));

                    if (includeUserDrafts && user) {
                        return mappedData.filter(loc =>
                            loc.status === 'published' || loc.ownerId === user.id
                        ) as Location[];
                    }

                    return mappedData as Location[];
                }
            } catch (err) {
                console.error('Failed to fetch from Supabase:', err);
            }

            let userCreatedLocations: Location[] = [];
            try {
                const storedLocations = localStorage.getItem(CREATED_LOCATIONS_KEY);
                if (storedLocations) {
                    userCreatedLocations = JSON.parse(storedLocations);
                    console.log('Loaded user created locations from localStorage:', userCreatedLocations);
                }
            } catch (err) {
                console.error('Error reading from localStorage:', err);
            }

            let allLocations = [...DEMO_LOCATIONS];
            if (userCreatedLocations.length > 0) {
                allLocations = [...allLocations, ...userCreatedLocations];
            }

            if (filters) {
                if (filters.minPrice !== undefined) {
                    allLocations = allLocations.filter(loc => loc.price >= filters.minPrice!);
                }
                if (filters.maxPrice !== undefined) {
                    allLocations = allLocations.filter(loc => loc.price <= filters.maxPrice!);
                }
                if (filters.minArea !== undefined) {
                    allLocations = allLocations.filter(loc => loc.area >= filters.minArea!);
                }
                if (filters.maxArea !== undefined) {
                    allLocations = allLocations.filter(loc => loc.area <= filters.maxArea!);
                }
                if (filters.amenities && filters.amenities.length > 0) {
                    allLocations = allLocations.filter(loc => {
                        return filters.amenities!.every(amenity =>
                            loc.amenities?.includes(amenity)
                        );
                    });
                }
            }

            return allLocations;
        },
        staleTime: 10000,
    });
}

export function useCreateLocation() {
    const queryClient = useQueryClient();
    const { user } = useAuthContext();

    return useMutation({
        mutationFn: async (location: CreateLocationDTO) => {
            const timestamp = new Date().toISOString();

            if (!user) {
                throw new Error('User is not authenticated. Please log in.');
            }

            const imagesFolderName = `loc-${Date.now().toString()}`;

            let finalImages: string[] = [];
            if (location.images && location.images.length > 0) {
                try {
                    finalImages = await uploadImagesFromUrls(location.images, imagesFolderName);

                    if (finalImages.length === 0 && location.images.length > 0) {
                        console.warn('Images were not uploaded correctly, there might be issues with the storage service');
                    }
                } catch (error) {
                    console.error('Error uploading images:', error);
                    finalImages = location.images.filter(url => url.startsWith('http') && !url.startsWith('blob:'));
                }
            }

            const supabaseLocation = {
                title: location.title,
                description: location.description,
                address: location.address,
                price: location.price || 0,
                area: location.area || 0,
                images: finalImages,
                amenities: location.amenities || [],
                rules: location.rules || [],
                owner_id: user.id,
                created_at: timestamp,
                updated_at: timestamp,
                status: location.status || 'draft',
                features: location.features || {
                    maxCapacity: 1,
                    parkingSpots: 0,
                    equipmentIncluded: false,
                    accessibility: false
                },
                coordinates: location.coordinates || {
                    latitude: 55.7558,
                    longitude: 37.6173
                },
                minimum_booking_hours: location.minimumBookingHours || 2,
                bookings: {
                    totalBookings: 0,
                    averageRating: 0
                }
            };

            try {
                const { data, error } = await supabase
                    .from('locations')
                    .insert([supabaseLocation])
                    .select()
                    .single();

                if (error) {
                    console.error('Error saving location to Supabase:', error);

                    if (finalImages.length > 0) {
                        for (const imageUrl of finalImages) {
                            try {
                                if (imageUrl.includes('supabase')) {
                                    await deleteImage(imageUrl);
                                }
                            } catch (err) {
                                console.warn(`Could not delete image ${imageUrl}:`, err);
                            }
                        }
                    }

                    throw new Error(`Error saving location: ${error.message}`);
                }

                console.log('Location saved to Supabase successfully:', data);

                return data ? {
                    ...data,
                    ownerId: data.owner_id,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at,
                    minimumBookingHours: data.minimum_booking_hours
                } as Location : {} as Location;
            } catch (err) {
                console.error('Failed to save to Supabase:', err);
                throw err;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
        },
    });
}

export function useLocation(id: string, shareToken?: string) {
    const { user } = useAuthContext();

    return useQuery({
        queryKey: ['location', id, shareToken],
        queryFn: async () => {
            let effectiveAccessLevel: ShareAccessLevel | null = null;

            if (shareToken) {
                try {
                    const { data: shareData, error: shareError } = await supabase
                        .from('location_shares')
                        .select('*')
                        .eq('location_id', id)
                        .eq('share_token', shareToken)
                        .single();

                    if (!shareError && shareData) {
                        effectiveAccessLevel = shareData.access_level as ShareAccessLevel;
                        console.log('Valid share token found with access level:', effectiveAccessLevel);
                    } else {
                        console.log('Share token is invalid or not found:', shareError);
                    }
                } catch (err) {
                    console.error('Error checking share token:', err);
                }
            }

            try {
                const { data: location, error } = await supabase
                    .from('locations')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) {
                    console.error('Failed to fetch location from Supabase:', error);
                    throw error;
                }

                if (!location) {
                    throw new Error('Location not found');
                }

                const isOwner = user && location.owner_id === user.id;
                const isPublished = location.status === 'published';
                const hasValidShareToken = !!effectiveAccessLevel;

                if (!isPublished && !isOwner && !hasValidShareToken) {
                    throw new Error('This location is not available or you do not have access');
                }

                return {
                    ...location,
                    ownerId: location.owner_id,
                    createdAt: location.created_at,
                    updatedAt: location.updated_at,
                    minimumBookingHours: location.minimum_booking_hours,
                    shareToken: location.share_token,
                    shareAccessLevel: effectiveAccessLevel || undefined
                } as Location;
            } catch (err) {
                console.error('Error loading location:', err);

                if (!shareToken) {
                    const demoLocation = DEMO_LOCATIONS.find(loc => loc.id === id);
                    if (demoLocation) {
                        return demoLocation;
                    }

                    try {
                        const storedLocations = localStorage.getItem(CREATED_LOCATIONS_KEY);
                        if (storedLocations) {
                            const userCreatedLocations: Location[] = JSON.parse(storedLocations);
                            const userLocation = userCreatedLocations.find(loc => loc.id === id);
                            if (userLocation) {
                                console.log('Found location in localStorage:', userLocation);
                                return userLocation;
                            }
                        }
                    } catch (storageErr) {
                        console.error('Error reading from localStorage:', storageErr);
                    }
                }

                throw new Error('Location not found or you do not have access');
            }
        },
    });
}

export function useDeleteLocation() {
    const queryClient = useQueryClient();
    const { user } = useAuthContext();

    return useMutation({
        mutationFn: async (id: string) => {
            const isDemoLocation = DEMO_LOCATIONS.some(loc => loc.id === id);
            if (isDemoLocation) {
                throw new Error('Demo locations cannot be deleted');
            }

            if (user) {
                try {
                    const { data: location, error: fetchError } = await supabase
                        .from('locations')
                        .select('*')
                        .eq('id', id)
                        .single();

                    if (!fetchError && location) {
                        if (location.owner_id !== user.id) {
                            throw new Error('You can only delete your own locations');
                        }

                        if (location.images && location.images.length > 0) {
                            await Promise.all(
                                location.images.map(async (imageUrl: string) => {
                                    try {
                                        if (imageUrl.includes('supabase')) {
                                            await deleteImage(imageUrl);
                                        }
                                    } catch (err) {
                                        console.warn(`Could not delete image ${imageUrl}:`, err);
                                    }
                                })
                            );
                        }

                        const { error: deleteError } = await supabase
                            .from('locations')
                            .delete()
                            .eq('id', id);

                        if (deleteError) {
                            console.error('Error deleting location from Supabase:', deleteError);
                            throw new Error(`Failed to delete location: ${deleteError.message}`);
                        }

                        console.log('Location deleted from Supabase successfully');
                        return { success: true, id };
                    }
                } catch (err) {
                    console.error('Failed to delete location from Supabase:', err);
                }
            }

            try {
                const storedLocations = localStorage.getItem(CREATED_LOCATIONS_KEY);
                if (storedLocations) {
                    let userCreatedLocations: Location[] = JSON.parse(storedLocations);
                    const localLocationIndex = userCreatedLocations.findIndex(loc => loc.id === id);

                    if (localLocationIndex >= 0) {
                        userCreatedLocations.splice(localLocationIndex, 1);
                        localStorage.setItem(CREATED_LOCATIONS_KEY, JSON.stringify(userCreatedLocations));
                        console.log('Location removed from localStorage');
                        return { success: true, id };
                    }
                }
            } catch (err) {
                console.error('Error working with localStorage:', err);
            }

            throw new Error('Location not found or could not be deleted');
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            queryClient.invalidateQueries({ queryKey: ['location', result.id] });
        },
    });
}

export function useUpdateLocationStatus() {
    const queryClient = useQueryClient();
    const { user } = useAuthContext();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'draft' | 'published' | 'archived' }) => {
            if (!user) {
                throw new Error('User is not authenticated. Please log in.');
            }

            try {
                const { data: location, error: fetchError } = await supabase
                    .from('locations')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (fetchError) {
                    console.error('Error fetching location from Supabase:', fetchError);
                    throw new Error(`Failed to fetch location: ${fetchError.message}`);
                }

                if (!location) {
                    throw new Error('Location not found');
                }

                if (location.owner_id !== user.id) {
                    throw new Error('You can only update your own locations');
                }

                const { data, error } = await supabase
                    .from('locations')
                    .update({ status, updated_at: new Date().toISOString() })
                    .eq('id', id)
                    .select()
                    .single();

                if (error) {
                    console.error('Error updating location status in Supabase:', error);
                    throw new Error(`Failed to update location status: ${error.message}`);
                }

                console.log('Location status updated successfully:', data);

                return data ? {
                    ...data,
                    ownerId: data.owner_id,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at,
                    minimumBookingHours: data.minimum_booking_hours
                } as Location : {} as Location;
            } catch (err) {
                console.error('Failed to update location status:', err);
                throw err;
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            queryClient.invalidateQueries({ queryKey: ['location', variables.id] });
        },
    });
}

export function useCreateLocationShare() {
    const queryClient = useQueryClient();
    const { user } = useAuthContext();

    return useMutation({
        mutationFn: async ({
            locationId,
            accessLevel,
            name = ''
        }: {
            locationId: string;
            accessLevel: ShareAccessLevel;
            name?: string;
        }) => {
            if (!user) {
                throw new Error('User is not authenticated. Please log in.');
            }

            try {
                const { data: location, error: fetchError } = await supabase
                    .from('locations')
                    .select('*')
                    .eq('id', locationId)
                    .single();

                if (fetchError) {
                    console.error('Error fetching location from Supabase:', fetchError);
                    throw new Error(`Failed to fetch location: ${fetchError.message}`);
                }

                if (!location) {
                    throw new Error('Location not found');
                }

                if (location.owner_id !== user.id) {
                    throw new Error('You can only share your own locations');
                }

                const { data: tokenData, error: tokenError } = await supabase
                    .rpc('generate_unique_share_token');

                if (tokenError) {
                    console.error('Error generating share token:', tokenError);
                    throw new Error(`Failed to generate share token: ${tokenError.message}`);
                }

                const shareToken = tokenData || (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

                const { data: shareData, error: shareError } = await supabase
                    .from('location_shares')
                    .insert([{
                        location_id: locationId,
                        share_token: shareToken,
                        access_level: accessLevel,
                        created_by: user.id,
                        name: name || null
                    }])
                    .select()
                    .single();

                if (shareError) {
                    console.error('Error creating location share:', shareError);
                    throw new Error(`Failed to create share link: ${shareError.message}`);
                }

                return {
                    id: shareData.id,
                    locationId: shareData.location_id,
                    shareToken: shareData.share_token,
                    accessLevel: shareData.access_level as ShareAccessLevel,
                    createdAt: shareData.created_at,
                    expiresAt: shareData.expires_at,
                    createdBy: shareData.created_by,
                    name: shareData.name
                } as LocationShare;
            } catch (err) {
                console.error('Failed to create location share:', err);
                throw err;
            }
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['location-shares', result.locationId] });
        },
    });
}

export function useLocationShares(locationId: string) {
    const { user } = useAuthContext();

    return useQuery({
        queryKey: ['location-shares', locationId],
        queryFn: async () => {
            if (!user) {
                throw new Error('User is not authenticated. Please log in.');
            }

            try {
                const { data: location, error: fetchError } = await supabase
                    .from('locations')
                    .select('*')
                    .eq('id', locationId)
                    .single();

                if (fetchError) {
                    console.error('Error fetching location from Supabase:', fetchError);
                    throw new Error(`Failed to fetch location: ${fetchError.message}`);
                }

                if (!location) {
                    throw new Error('Location not found');
                }

                if (location.owner_id !== user.id) {
                    throw new Error('You can only view shares for your own locations');
                }

                const { data: sharesData, error: sharesError } = await supabase
                    .from('location_shares')
                    .select('*')
                    .eq('location_id', locationId)
                    .order('created_at', { ascending: false });

                if (sharesError) {
                    console.error('Error fetching location shares:', sharesError);
                    throw new Error(`Failed to fetch share links: ${sharesError.message}`);
                }

                return (sharesData || []).map(share => ({
                    id: share.id,
                    locationId: share.location_id,
                    shareToken: share.share_token,
                    accessLevel: share.access_level as ShareAccessLevel,
                    createdAt: share.created_at,
                    expiresAt: share.expires_at,
                    createdBy: share.created_by,
                    name: share.name
                } as LocationShare));
            } catch (err) {
                console.error('Failed to fetch location shares:', err);
                return [];
            }
        },
        enabled: !!user && !!locationId,
    });
}

export function useLocationShareAccess(locationId: string, shareToken?: string) {
    return useQuery({
        queryKey: ['location-share-access', locationId, shareToken],
        queryFn: async () => {
            console.log('Checking share access with token:', shareToken, 'for location:', locationId);

            if (!shareToken) {
                console.log('No share token provided');
                return null;
            }

            try {
                const { data: shareData, error: shareError } = await supabase
                    .from('location_shares')
                    .select('*')
                    .eq('location_id', locationId)
                    .eq('share_token', shareToken)
                    .single();

                if (shareError) {
                    console.error('Error fetching location share access:', shareError);
                    return null;
                }

                if (!shareData) {
                    console.log('No share data found for token');
                    return null;
                }

                if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
                    console.log('Share token has expired:', shareData.expires_at);
                    return null;
                }

                console.log('Share access found:', shareData.access_level, 'All share data:', shareData);
                return shareData.access_level as ShareAccessLevel;
            } catch (err) {
                console.error('Failed to fetch location share access:', err);
                return null;
            }
        },
        enabled: !!shareToken && !!locationId,
    });
}

export function useDeleteLocationShare() {
    const queryClient = useQueryClient();
    const { user } = useAuthContext();

    return useMutation({
        mutationFn: async ({ shareId, locationId }: { shareId: string; locationId: string }) => {
            if (!user) {
                throw new Error('User is not authenticated. Please log in.');
            }

            try {
                const { data: shareData, error: fetchError } = await supabase
                    .from('location_shares')
                    .select('*, locations!inner(*)')
                    .eq('id', shareId)
                    .single();

                if (fetchError) {
                    console.error('Error fetching location share:', fetchError);
                    throw new Error(`Failed to fetch share link: ${fetchError.message}`);
                }

                if (!shareData) {
                    throw new Error('Share link not found');
                }

                if (shareData.locations.owner_id !== user.id) {
                    throw new Error('You can only delete shares for your own locations');
                }

                const { error: deleteError } = await supabase
                    .from('location_shares')
                    .delete()
                    .eq('id', shareId);

                if (deleteError) {
                    console.error('Error deleting location share:', deleteError);
                    throw new Error(`Failed to delete share link: ${deleteError.message}`);
                }

                return { success: true, id: shareId, locationId };
            } catch (err) {
                console.error('Failed to delete location share:', err);
                throw err;
            }
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['location-shares', result.locationId] });
        },
    });
}

export function useUpdateLocation() {
    const queryClient = useQueryClient();
    const { user } = useAuthContext();

    return useMutation({
        mutationFn: async ({ id, location, shareToken }: { id: string; location: Partial<CreateLocationDTO>; shareToken?: string }) => {
            const timestamp = new Date().toISOString();

            if (!user && !shareToken) {
                throw new Error('User is not authenticated. Please log in.');
            }

            try {
                const { data: existingLocation, error: fetchError } = await supabase
                    .from('locations')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (fetchError) {
                    console.error('Error fetching location from Supabase:', fetchError);
                    throw new Error(`Failed to fetch location: ${fetchError.message}`);
                }

                if (!existingLocation) {
                    throw new Error('Location not found');
                }

                let hasEditAccess = false;

                if (user && existingLocation.owner_id === user.id) {
                    hasEditAccess = true;
                }

                if (!hasEditAccess && shareToken) {
                    const { data: shareData, error: shareError } = await supabase
                        .from('location_shares')
                        .select('*')
                        .eq('location_id', id)
                        .eq('share_token', shareToken)
                        .single();

                    if (!shareError && shareData &&
                        (shareData.access_level === 'admin' || shareData.access_level === 'full_info')) {
                        hasEditAccess = true;

                        if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
                            throw new Error('The share link has expired');
                        }
                    }
                }

                if (!hasEditAccess) {
                    throw new Error('You do not have permission to update this location');
                }

                let finalImages = existingLocation.images || [];

                if (location.images && location.images.length > 0) {
                    const newImages = location.images.filter(img =>
                        img.startsWith('blob:') ||
                        (img.startsWith('http') && !existingLocation.images.includes(img))
                    );

                    if (newImages.length > 0) {
                        try {
                            const imagesFolderName = existingLocation.tempImageFolder || `loc-${Date.now().toString()}`;
                            const uploadedImages = await uploadImagesFromUrls(newImages, imagesFolderName);

                            finalImages = [...finalImages.filter((img: string) => !img.startsWith('blob:'))];

                            const imageMap = new Map();
                            uploadedImages.forEach((url, index) => {
                                imageMap.set(newImages[index], url);
                            });

                            location.images.forEach(img => {
                                if (existingLocation.images.includes(img)) {
                                    if (!finalImages.includes(img)) {
                                        finalImages.push(img);
                                    }
                                } else if (imageMap.has(img)) {
                                    finalImages.push(imageMap.get(img));
                                }
                            });
                        } catch (error) {
                            console.error('Error uploading images:', error);
                        }
                    } else {
                        finalImages = location.images.filter(img => !img.startsWith('blob:'));
                    }
                }

                const updatedLocation = {
                    title: location.title ?? existingLocation.title,
                    description: location.description ?? existingLocation.description,
                    address: location.address ?? existingLocation.address,
                    price: location.price ?? existingLocation.price,
                    area: location.area ?? existingLocation.area,
                    images: finalImages,
                    amenities: location.amenities ?? existingLocation.amenities,
                    rules: location.rules ?? existingLocation.rules,
                    updated_at: timestamp,
                    status: location.status ?? existingLocation.status,
                    features: location.features ?? existingLocation.features,
                    coordinates: location.coordinates ?? existingLocation.coordinates,
                    minimum_booking_hours: location.minimumBookingHours ?? existingLocation.minimum_booking_hours,
                    tags: location.tags ?? existingLocation.tags,
                    availability: location.availability ?? existingLocation.availability
                };

                const { data, error } = await supabase
                    .from('locations')
                    .update(updatedLocation)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) {
                    console.error('Error updating location in Supabase:', error);
                    throw new Error(`Failed to update location: ${error.message}`);
                }

                console.log('Location updated successfully:', data);

                return data ? {
                    ...data,
                    ownerId: data.owner_id,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at,
                    minimumBookingHours: data.minimum_booking_hours
                } as Location : {} as Location;
            } catch (err) {
                console.error('Failed to update location:', err);
                throw err;
            }
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            queryClient.invalidateQueries({ queryKey: ['location', result.id] });
        },
    });
}