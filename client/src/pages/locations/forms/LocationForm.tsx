import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateLocation, useLocation, useUpdateLocation } from "@/hooks/useLocations";
import { useAuthContext } from "@/hooks/useAuthContext";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft,
    Plus,
    X,
    Loader2,
    ArrowLeft as ArrowLeftIcon,
    ArrowRight,
    Home,
    MapPin,
    FileText,
    DollarSign,
    Square,
    Users,
    Camera,
    Wifi,
    Clock,
    Stamp,
    Settings,
    Building,
    Calendar,
    ParkingCircle,
    Accessibility,
    Package,
    BookOpen,
    ClipboardList,
    FileImage,
    ImagePlus,
    UploadCloud,
    Trash2,
    MoveHorizontal,
    Info,
    Save,
} from "lucide-react";
import { Link } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { LocationPicker } from "@/components/map/location-picker";
import { Badge } from "@/components/ui/badge";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { initializeStorage } from "@/lib/imageService";
import { useImageUploader } from "@/hooks/useImageUploader";
import { Progress } from "@/components/ui/progress";

const schema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    address: z.string().min(1, "Address is required"),
    price: z.number().min(0, "Price must be positive"),
    area: z.number().min(0, "Area must be positive"),
    coordinates: z.object({
        latitude: z.number(),
        longitude: z.number()
    }).optional(),
    images: z.array(z.string()).default([]),
    amenities: z.array(z.string()).default([]),
    rules: z.array(z.string()).default([]),
    features: z.object({
        maxCapacity: z.number().min(1, "Capacity must be at least 1"),
        parkingSpots: z.number().min(0, "Parking spots cannot be negative"),
        equipmentIncluded: z.boolean().default(false),
        accessibility: z.boolean().default(false),
    }).optional(),
    tags: z.array(z.string()).default([]),
    minimumBookingHours: z.number().min(1, "Minimum booking hours must be at least 1").default(2),
    availability: z.object({
        openTime: z.string().optional(),
        closeTime: z.string().optional(),
        daysAvailable: z.array(z.string()).default([])
    }).optional(),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

const COMMON_AMENITIES = [
    "WiFi", "Air Conditioning", "Heating", "Kitchen", "Free Parking",
    "Bathroom", "Makeup Area", "Background Stands", "Lighting Equipment",
    "Audio Equipment", "Props & Furniture", "Dressing Room", "Coffee Machine"
];

const LOCATION_TAGS = [
    "Studio", "Outdoor", "Urban", "Nature", "Industrial", "Minimalist",
    "Vintage", "Modern", "Home", "Office", "Restaurant", "Workshop", "Event Space"
];

const DAYS_OF_WEEK = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

interface LocationFormProps {
    mode: 'create' | 'edit';
    locationId?: string;
    shareToken?: string;
}

export default function LocationForm({ mode, locationId, shareToken }: LocationFormProps) {
    const navigate = useNavigate();
    const { user } = useAuthContext();

    const { mutateAsync: createLocation, isPending: isCreatingLocation } = useCreateLocation();
    const { mutateAsync: updateLocation, isPending: isUpdatingLocation } = useUpdateLocation();
    const { data: existingLocation, isLoading: isLoadingLocation } =
        mode === 'edit' && locationId ? useLocation(locationId, shareToken) : { data: null, isLoading: false };

    const [activeTab, setActiveTab] = useState("basic");
    const [newAmenity, setNewAmenity] = useState("");
    const [newRule, setNewRule] = useState("");
    const [newTag, setNewTag] = useState("");
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [actualImageFiles, setActualImageFiles] = useState<File[]>([]);
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [isFormReady, setIsFormReady] = useState(mode === 'create');

    const { toast } = useToast();
    const { isUploading, progress } = useImageUploader();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageLayoutRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) {
            navigate("/auth/login", {
                state: {
                    from: mode === 'edit' ? `/locations/edit/${locationId}` : "/locations/new"
                }
            });
        } else {
            initializeStorage().catch(error => {
                console.error("Storage initialization error:", error);
            });
        }
    }, [user, navigate, locationId, mode]);

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            title: "",
            description: "",
            address: "",
            price: 0,
            area: 0,
            images: [],
            amenities: [],
            rules: [],
            tags: [],
            features: {
                maxCapacity: 1,
                parkingSpots: 0,
                equipmentIncluded: false,
                accessibility: false,
            },
            minimumBookingHours: 2,
            availability: {
                openTime: "09:00",
                closeTime: "18:00",
                daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
            },
            status: mode === 'create' ? 'published' as const : 'draft' as const,
        },
    });

    useEffect(() => {
        if (mode === 'edit' && existingLocation && !isFormReady) {
            form.reset({
                title: existingLocation.title || "",
                description: existingLocation.description || "",
                address: existingLocation.address || "",
                price: existingLocation.price || 0,
                area: existingLocation.area || 0,
                coordinates: existingLocation.coordinates || { latitude: 0, longitude: 0 },
                images: existingLocation.images || [],
                amenities: existingLocation.amenities || [],
                rules: existingLocation.rules || [],
                tags: existingLocation.tags || [],
                features: existingLocation.features || {
                    maxCapacity: 1,
                    parkingSpots: 0,
                    equipmentIncluded: false,
                    accessibility: false,
                },
                minimumBookingHours: existingLocation.minimumBookingHours || 2,
                availability: existingLocation.availability || {
                    openTime: "09:00",
                    closeTime: "18:00",
                    daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                },
                status: existingLocation.status || 'published',
            });

            setUploadedImages(existingLocation.images || []);
            setIsFormReady(true);
        }
    }, [existingLocation, form, isFormReady, mode]);

    const onSubmit = async (values: z.infer<typeof schema>) => {
        try {
            if (!user?.id) {
                throw new Error("User is not authenticated");
            }

            setIsSubmitting(true);

            if (!values.title || !values.description || !values.address) {
                toast({
                    title: "Error",
                    description: "Please fill in all required fields",
                    variant: "destructive"
                });
                setIsSubmitting(false);
                return;
            }

            const availability = values.availability ? {
                openTime: values.availability.openTime || "09:00",
                closeTime: values.availability.closeTime || "18:00",
                daysAvailable: values.availability.daysAvailable || []
            } : undefined;

            const locationData = {
                ...values,
                ownerId: user.id,
                images: uploadedImages,
                coordinates: values.coordinates || {
                    latitude: 0,
                    longitude: 0
                },
                availability
            };

            if (mode === 'create') {
                await createLocation({
                    ...locationData,
                    status: 'published' as const
                });
                toast({
                    title: "Success!",
                    description: "Location created successfully",
                });
                navigate("/locations");
            } else {
                if (!locationId) {
                    throw new Error("Location ID not provided");
                }
                await updateLocation({
                    id: locationId,
                    location: locationData,
                    ...(shareToken ? { shareToken } : {})
                });
                toast({
                    title: "Success!",
                    description: "Location updated successfully",
                });
                navigate(`/locations/${locationId}${shareToken ? `?token=${shareToken}` : ''}`);
            }

        } catch (error: any) {
            console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} location:`, error);
            toast({
                title: "Error",
                description: error.message || `Failed to ${mode === 'create' ? 'create' : 'update'} location`,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLocationSelect = (location: { address: string; coordinates: { latitude: number; longitude: number } }) => {
        form.setValue("address", location.address);
        form.setValue("coordinates", location.coordinates);
    };

    const handleAddAmenity = () => {
        if (!newAmenity || newAmenity.trim() === "") return;

        const currentAmenities = form.getValues("amenities") || [];
        if (!currentAmenities.includes(newAmenity)) {
            form.setValue("amenities", [...currentAmenities, newAmenity]);
            setNewAmenity("");
        }
    };

    const handleRemoveAmenity = (amenity: string) => {
        const currentAmenities = form.getValues("amenities") || [];
        form.setValue("amenities", currentAmenities.filter(a => a !== amenity));
    };

    const handleAddTag = () => {
        if (!newTag || newTag.trim() === "") return;

        const currentTags = form.getValues("tags") || [];
        if (!currentTags.includes(newTag)) {
            form.setValue("tags", [...currentTags, newTag]);
            setNewTag("");
        }
    };

    const handleRemoveTag = (tag: string) => {
        const currentTags = form.getValues("tags") || [];
        form.setValue("tags", currentTags.filter(t => t !== tag));
    };

    const toggleDaySelection = (day: string) => {
        const currentDays = form.getValues("availability.daysAvailable") || [];
        if (currentDays.includes(day)) {
            form.setValue("availability.daysAvailable", currentDays.filter(d => d !== day));
        } else {
            form.setValue("availability.daysAvailable", [...currentDays, day]);
        }
    };

    const handleAddRule = () => {
        if (!newRule || newRule.trim() === "") return;

        const currentRules = form.getValues("rules") || [];
        if (!currentRules.includes(newRule)) {
            form.setValue("rules", [...currentRules, newRule]);
            setNewRule("");
        }
    };

    const handleRemoveRule = (rule: string) => {
        const currentRules = form.getValues("rules") || [];
        form.setValue("rules", currentRules.filter(r => r !== rule));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        processFiles(Array.from(files));
    };

    const processFiles = (newFiles: File[]) => {
        const imageFiles = newFiles.filter(file =>
            file.type.startsWith('image/')
        );

        if (imageFiles.length === 0) {
            toast({
                title: "Warning",
                description: "Please select image files only",
                variant: "destructive"
            });
            return;
        }

        const newImages = imageFiles.map(file => URL.createObjectURL(file));

        setUploadedImages([...uploadedImages, ...newImages]);
        setActualImageFiles([...actualImageFiles, ...imageFiles]);
        form.setValue("images", [...uploadedImages, ...newImages]);

        toast({
            title: "Images added",
            description: `${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} successfully added`,
        });
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === "dragenter" || e.type === "dragleave" || e.type === "dragover") {
            setDragActive(e.type === "dragenter" || e.type === "dragover");
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveImage = (imageUrl: string, index: number) => {
        const updatedImages = uploadedImages.filter((_, i) => i !== index);
        setUploadedImages(updatedImages);

        if (imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imageUrl);
        }

        const updatedFiles = [...actualImageFiles];
        updatedFiles.splice(index, 1);
        setActualImageFiles(updatedFiles);

        if (index === mainImageIndex) {
            setMainImageIndex(0);
        } else if (index < mainImageIndex) {
            setMainImageIndex(mainImageIndex - 1);
        }

        form.setValue("images", updatedImages);
    };

    const moveImage = (fromIndex: number, toIndex: number) => {
        if (
            fromIndex < 0 ||
            fromIndex >= uploadedImages.length ||
            toIndex < 0 ||
            toIndex >= uploadedImages.length
        ) {
            return;
        }

        const updatedImages = [...uploadedImages];
        const [movedImage] = updatedImages.splice(fromIndex, 1);
        updatedImages.splice(toIndex, 0, movedImage);

        const updatedFiles = [...actualImageFiles];
        if (updatedFiles.length > fromIndex && updatedFiles.length > toIndex) {
            const [movedFile] = updatedFiles.splice(fromIndex, 1);
            updatedFiles.splice(toIndex, 0, movedFile);
        }

        if (fromIndex === mainImageIndex) {
            setMainImageIndex(toIndex);
        } else if (
            (fromIndex < mainImageIndex && toIndex >= mainImageIndex) ||
            (fromIndex > mainImageIndex && toIndex <= mainImageIndex)
        ) {
            setMainImageIndex(
                fromIndex < mainImageIndex ? mainImageIndex - 1 : mainImageIndex + 1
            );
        }

        setUploadedImages(updatedImages);
        setActualImageFiles(updatedFiles);
        form.setValue("images", updatedImages);
    };

    const renderUploadProgress = () => {
        if (isUploading) {
            return (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-xl font-semibold mb-4">Uploading images</h3>
                        <Progress value={progress} className="h-3 mb-4" />
                        <p className="text-center">{progress}% completed</p>
                        <p className="text-sm text-gray-500 text-center mt-2">
                            Please wait while your images are being uploaded...
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (mode === 'edit' && isLoadingLocation) {
        return (
            <div className="container max-w-3xl py-8 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || (mode === 'edit' && !existingLocation)) {
        return <div>Redirecting to login...</div>;
    }

    if (mode === 'edit' && !isFormReady) {
        return (
            <div className="container max-w-3xl py-8 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="ml-3">Loading location data...</span>
            </div>
        );
    }

    const backLink = mode === 'edit' ? `/locations/${locationId}` : "/locations";
    const formTitle = mode === 'edit' ? "Edit Location" : "Add New Location";
    const submitButtonText = mode === 'edit' ? "Save Changes" : "Create Location";
    const isProcessing = mode === 'edit' ? isUpdatingLocation : isCreatingLocation;

    return (
        <div className="container max-w-3xl py-8">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild>
                    <Link to={backLink}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">{formTitle}</h1>
            </div>

            {renderUploadProgress()}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-6 mb-6">
                            <TabsTrigger value="basic" className="flex items-center gap-2">
                                <Home size={16} />
                                <span className="hidden sm:inline">Basic Info</span>
                            </TabsTrigger>
                            <TabsTrigger value="images" className="flex items-center gap-2">
                                <Camera size={16} />
                                <span className="hidden sm:inline">Images</span>
                            </TabsTrigger>
                            <TabsTrigger value="features" className="flex items-center gap-2">
                                <Settings size={16} />
                                <span className="hidden sm:inline">Features</span>
                            </TabsTrigger>
                            <TabsTrigger value="amenities" className="flex items-center gap-2">
                                <Wifi size={16} />
                                <span className="hidden sm:inline">Amenities</span>
                            </TabsTrigger>
                            <TabsTrigger value="rules" className="flex items-center gap-2">
                                <ClipboardList size={16} />
                                <span className="hidden sm:inline">Rules</span>
                            </TabsTrigger>
                            <TabsTrigger value="scheduling" className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span className="hidden sm:inline">Scheduling</span>
                            </TabsTrigger>
                            </TabsList>

                        <TabsContent value="basic" className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Building size={16} />
                                                Location Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Studio Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <MapPin size={16} />
                                                Address
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="123 Example St." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <FileText size={16} />
                                            Description
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe your location..."
                                                className="min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-4">
                                <FormLabel className="flex items-center gap-2">
                                    <MapPin size={16} />
                                    Location on Map
                                </FormLabel>

                                <LocationPicker
                                    onLocationSelect={handleLocationSelect}
                                    defaultAddress={form.getValues("address")}
                                    updateAddressOnClick={true}
                                />
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <DollarSign size={16} />
                                                Price per hour (€)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="2500"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="area"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Square size={16} />
                                                Area (m²)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="80"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <FormLabel className="flex items-center gap-2">
                                    <Stamp size={16} />
                                    Location Tags
                                </FormLabel>
                                <FormDescription>
                                    Add tags to categorize your location
                                </FormDescription>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {LOCATION_TAGS.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant={form.watch("tags")?.includes(tag) ? "default" : "outline"}
                                            className="cursor-pointer"
                                            onClick={() => {
                                                const currentTags = form.getValues("tags") || [];
                                                if (currentTags.includes(tag)) {
                                                    form.setValue("tags", currentTags.filter(t => t !== tag));
                                                } else {
                                                    form.setValue("tags", [...currentTags, tag]);
                                                }
                                            }}
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        placeholder="Add custom tag"
                                        className="flex-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleAddTag}
                                        disabled={!newTag.trim()}
                                    >
                                        <Plus size={16} className="mr-1" /> Add
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    {form.watch("tags")?.filter(tag => !LOCATION_TAGS.includes(tag)).map((tag, index) => (
                                        <Badge
                                            key={index}
                                            className="flex items-center gap-1 py-1.5 pl-3 pr-2"
                                        >
                                            {tag}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 rounded-full"
                                                onClick={() => handleRemoveTag(tag)}
                                            >
                                                <X size={12} />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="images" className="space-y-6">
                            <div>
                                <FormLabel className="flex items-center gap-2">
                                    <Camera size={16} />
                                    Upload Images
                                </FormLabel>
                                <FormDescription className="mb-4">
                                    Upload high-quality images of your location. The first image will be used as the main image on listings.
                                </FormDescription>

                                {/* Drag and drop image upload area */}
                                <div
                                    className={`border-2 border-dashed rounded-lg p-6 mb-6 transition-colors
                                        ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-200'}
                                        ${!uploadedImages.length ? 'cursor-pointer' : ''}
                                    `}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => !uploadedImages.length && triggerFileInput()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />

                                    {!uploadedImages.length ? (
                                        <div className="flex flex-col items-center justify-center py-4">
                                            <UploadCloud size={48} className="text-gray-400 mb-3" />
                                            <h3 className="text-lg font-medium mb-1">Drag & drop images here</h3>
                                            <p className="text-sm text-gray-500 mb-3 text-center">
                                                or click to browse files<br />
                                                (JPG, PNG, WebP - max 10MB per image)
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={triggerFileInput}
                                                className="flex items-center gap-2"
                                            >
                                                <ImagePlus size={16} />
                                                Select Images
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row items-center justify-between">
                                            <div className="flex items-center mb-4 sm:mb-0">
                                                <FileImage size={24} className="text-gray-400 mr-3" />
                                                <div>
                                                    <h3 className="font-medium">{uploadedImages.length} images selected</h3>
                                                    <p className="text-sm text-gray-500">Drag to reorder or click to set as main image</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={triggerFileInput}
                                                    className="flex items-center gap-1"
                                                >
                                                    <ImagePlus size={14} />
                                                    Add More
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="flex items-center gap-1"
                                                    onClick={() => {
                                                        uploadedImages.forEach(url => {
                                                            if (url.startsWith('blob:')) URL.revokeObjectURL(url);
                                                        });
                                                        setUploadedImages([]);
                                                        setActualImageFiles([]);
                                                        form.setValue("images", []);
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                    Clear All
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Image preview grid */}
                                {uploadedImages.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1 mb-2">
                                            <p className="text-sm font-medium flex items-center gap-1">
                                                <Info size={14} className="text-gray-400" />
                                                <span>First image will be the main one</span>
                                            </p>
                                            <div className="text-sm text-gray-500 flex items-center gap-1">
                                                <MoveHorizontal size={14} />
                                                <span>Drag to reorder</span>
                                            </div>
                                        </div>

                                        <div ref={imageLayoutRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {uploadedImages.map((imageUrl, index) => (
                                                <div
                                                    key={index}
                                                    className={`relative group border rounded-md overflow-hidden transition-all
                                                        ${index === 0 ? 'ring-2 ring-primary ring-offset-2' : ''}
                                                    `}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('text/plain', index.toString());
                                                    }}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                                                        moveImage(fromIndex, index);
                                                    }}
                                                >
                                                    <div className="aspect-square">
                                                        <img
                                                            src={imageUrl}
                                                            alt={`Location image ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>

                                                    {/* Overlay controls */}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="outline"
                                                                className="h-7 w-7 bg-white/90 hover:bg-white text-red-500"
                                                                onClick={() => handleRemoveImage(imageUrl, index)}
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </div>

                                                        <div className="flex items-center justify-between w-full">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="secondary"
                                                                className="h-7 bg-white/90 hover:bg-white font-medium"
                                                                onClick={() => index !== 0 && moveImage(index, 0)}
                                                                disabled={index === 0}
                                                            >
                                                                Set as Main
                                                            </Button>

                                                            <div className="flex gap-1">
                                                                <Button
                                                                    type="button"
                                                                    size="icon"
                                                                    variant="outline"
                                                                    className="h-7 w-7 bg-white/90 hover:bg-white"
                                                                    onClick={() => moveImage(index, Math.max(0, index - 1))}
                                                                    disabled={index === 0}
                                                                >
                                                                    <ArrowLeftIcon size={14} />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="icon"
                                                                    variant="outline"
                                                                    className="h-7 w-7 bg-white/90 hover:bg-white"
                                                                    onClick={() => moveImage(index, Math.min(uploadedImages.length - 1, index + 1))}
                                                                    disabled={index === uploadedImages.length - 1}
                                                                >
                                                                    <ArrowRight size={14} />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Main image badge */}
                                                    {index === 0 && (
                                                        <div className="absolute top-2 left-2">
                                                            <Badge className="bg-primary/90 text-white">Main</Badge>
                                                        </div>
                                                    )}

                                                    {/* Image number */}
                                                    <div className="absolute bottom-2 right-2">
                                                        <Badge variant="outline" className="bg-black/50 text-white border-0">
                                                            {index + 1}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add more images button */}
                                            <button
                                                type="button"
                                                onClick={triggerFileInput}
                                                className="border-2 border-dashed border-gray-200 rounded-md flex flex-col items-center justify-center p-4 aspect-square hover:border-gray-300 hover:bg-gray-50 transition-colors"
                                            >
                                                <ImagePlus size={32} className="text-gray-400 mb-2" />
                                                <span className="text-sm text-gray-500">Add More</span>
                                            </button>
                                        </div>

                                        <p className="text-sm text-gray-500 mt-4">
                                            Tip: High-quality images with good lighting will attract more bookings
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="features" className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="features.maxCapacity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Users size={16} />
                                                Maximum Capacity
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder="10"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                    value={field.value || 1}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Maximum number of people allowed in the location
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="features.parkingSpots"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <ParkingCircle size={16} />
                                                Parking Spots
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                    value={field.value || 0}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Number of available parking spots
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="features.equipmentIncluded"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="flex items-center gap-2">
                                                    <Camera size={16} />
                                                    Equipment Included
                                                </FormLabel>
                                                <FormDescription>
                                                    Check if your location includes photography or filming equipment
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="features.accessibility"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="flex items-center gap-2">
                                                    <Accessibility size={16} />
                                                    Accessibility
                                                </FormLabel>
                                                <FormDescription>
                                                    Check if your location is accessible for people with disabilities
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="minimumBookingHours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Clock size={16} />
                                            Minimum Booking Hours
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="1"
                                                placeholder="2"
                                                {...field}
                                                onChange={e => field.onChange(Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Minimum number of hours required for a booking
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </TabsContent>

                        <TabsContent value="amenities" className="space-y-6">
                            <div>
                                <FormLabel className="flex items-center gap-2">
                                    <Package size={16} />
                                    Amenities
                                </FormLabel>
                                <FormDescription className="mb-4">
                                    Select or add amenities that your location offers
                                </FormDescription>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {COMMON_AMENITIES.map((amenity) => (
                                        <Badge
                                            key={amenity}
                                            variant={form.watch("amenities")?.includes(amenity) ? "default" : "outline"}
                                            className="cursor-pointer"
                                            onClick={() => {
                                                const currentAmenities = form.getValues("amenities") || [];
                                                if (currentAmenities.includes(amenity)) {
                                                    handleRemoveAmenity(amenity);
                                                } else {
                                                    form.setValue("amenities", [...currentAmenities, amenity]);
                                                }
                                            }}
                                        >
                                            {amenity}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="flex gap-2 mb-6">
                                    <Input
                                        value={newAmenity}
                                        onChange={(e) => setNewAmenity(e.target.value)}
                                        placeholder="Add custom amenity"
                                        className="flex-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddAmenity();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleAddAmenity}
                                        disabled={!newAmenity.trim()}
                                    >
                                        <Plus size={16} className="mr-1" /> Add
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {form.watch("amenities")?.map((amenity, index) => (
                                        <Badge
                                            key={index}
                                            className="flex items-center gap-1 py-1.5 pl-3 pr-2"
                                        >
                                            {amenity}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 rounded-full"
                                                onClick={() => handleRemoveAmenity(amenity)}
                                            >
                                                <X size={12} />
                                            </Button>
                                        </Badge>
                                    ))}

                                    {(!form.watch("amenities") || form.watch("amenities").length === 0) && (
                                        <p className="text-sm text-gray-400 p-2">No amenities added yet</p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="rules" className="space-y-6">
                            <div>
                                <FormLabel className="flex items-center gap-2">
                                    <BookOpen size={16} />
                                    Rules
                                </FormLabel>
                                <FormDescription className="mb-4">
                                    Add rules and policies for your location
                                </FormDescription>

                                <div className="flex gap-2 mb-6">
                                    <Input
                                        value={newRule}
                                        onChange={(e) => setNewRule(e.target.value)}
                                        placeholder="Add rule (e.g. No smoking, No food or drinks)"
                                        className="flex-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddRule();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleAddRule}
                                        disabled={!newRule.trim()}
                                    >
                                        <Plus size={16} className="mr-1" /> Add
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {form.watch("rules")?.map((rule, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                                            <span>{rule}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveRule(rule)}
                                            >
                                                <X size={16} />
                                            </Button>
                                        </div>
                                    ))}

                                    {(!form.watch("rules") || form.watch("rules").length === 0) && (
                                        <p className="text-sm text-gray-400 p-2">No rules added yet</p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="scheduling" className="space-y-6">
                            <div>
                                <FormLabel className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    Availability
                                </FormLabel>
                                <FormDescription className="mb-4">
                                    Set the days and hours your location is available for booking
                                </FormDescription>

                                <div className="grid gap-6 md:grid-cols-2 mb-6">
                                    <FormField
                                        control={form.control}
                                        name="availability.openTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Clock size={16} />
                                                    Opening Time
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="time"
                                                        {...field}
                                                        value={field.value || "09:00"}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="availability.closeTime"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Clock size={16} />
                                                    Closing Time
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="time"
                                                        {...field}
                                                        value={field.value || "18:00"}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <FormLabel className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        Available Days
                                    </FormLabel>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS_OF_WEEK.map((day) => {
                                            const isSelected = (form.watch("availability.daysAvailable") || []).includes(day);
                                            return (
                                                <Badge
                                                    key={day}
                                                    variant={isSelected ? "default" : "outline"}
                                                    className="cursor-pointer"
                                                    onClick={() => toggleDaySelection(day)}
                                                >
                                                    {day}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex items-center justify-between pt-6 border-t">
                        <div>
                            {mode === 'edit' && (
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2">
                                            <FormControl>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        checked={field.value === 'published'}
                                                        onCheckedChange={(checked) => {
                                                            field.onChange(checked ? 'published' : 'draft');
                                                        }}
                                                        id="publish-status"
                                                    />
                                                    <label
                                                        htmlFor="publish-status"
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {field.value === 'published' ? 'Published' : 'Draft'}
                                                    </label>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <div className="flex gap-4">
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || isProcessing || isUploading}
                                className="flex items-center gap-2"
                            >
                                {(isSubmitting || isProcessing) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : mode === 'edit' ? (
                                    <Save className="h-4 w-4" />
                                ) : null}
                                {submitButtonText}
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}