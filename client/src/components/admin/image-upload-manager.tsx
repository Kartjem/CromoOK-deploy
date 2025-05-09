import { useState, } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Info, Loader2, Upload } from 'lucide-react';
import { useImageUploader } from '@/hooks/useImageUploader';
import { useLocations } from '@/hooks/useLocations';
import { useAuthContext } from '@/context/AuthContext';

export function ImageUploadManager() {
    const { user } = useAuthContext();
    const { data: locations, isLoading } = useLocations();
    const { uploadAllLocationsImages, isUploading, progress } = useImageUploader();
    const [results, setResults] = useState<{
        success: number;
        failed: number;
        skipped: number;
        totalImages: number;
        uploadedImages: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async () => {
        if (!user || !locations || locations.length === 0) {
            return;
        }

        setError(null);
        setResults(null);

        try {
            const uploadResults = await uploadAllLocationsImages(locations);
            if (uploadResults && uploadResults.success && uploadResults.results) {
                setResults(uploadResults.results);
            } else if (uploadResults) {
                setError(uploadResults.message || 'Upload failed');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    };

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Upload Location Images to Supabase</CardTitle>
                <CardDescription>
                    Upload all location images from your application to Supabase Storage for persistent storage.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!user && (
                    <div className="p-4 mb-4 border border-blue-200 rounded-lg bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50">
                        <div className="flex items-start">
                            <Info className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400">Authentication Required</h3>
                                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                                    You need to log in before uploading images to Supabase.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 mb-4 border border-red-200 rounded-lg bg-red-50 dark:border-red-900 dark:bg-red-950/50">
                        <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium text-red-700 dark:text-red-400">Error</h3>
                                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : locations?.length === 0 ? (
                    <div className="p-4 mb-4 border border-blue-200 rounded-lg bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50">
                        <div className="flex items-start">
                            <Info className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400">No Locations</h3>
                                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                                    There are no locations available to upload images from.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Locations available</span>
                                <span className="text-sm font-medium">{locations?.length || 0}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Total images</span>
                                <span className="text-sm font-medium">
                                    {locations?.reduce((total, loc) => total + (loc.images?.length || 0), 0) || 0}
                                </span>
                            </div>
                        </div>

                        {(isUploading || results) && (
                            <div className="space-y-4 mb-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Upload progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>

                                {results && (
                                    <>
                                        <Separator className="my-4" />

                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{results.success}</p>
                                                <p className="text-sm text-muted-foreground">Locations Updated</p>
                                            </div>
                                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{results.uploadedImages}</p>
                                                <p className="text-sm text-muted-foreground">Images Uploaded</p>
                                            </div>
                                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{results.failed}</p>
                                                <p className="text-sm text-muted-foreground">Failed</p>
                                            </div>
                                        </div>

                                        {results.success > 0 && (
                                            <div className="p-4 border border-green-200 rounded-lg bg-green-50 dark:border-green-900 dark:bg-green-950/50">
                                                <div className="flex items-start">
                                                    <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <h3 className="text-sm font-medium text-green-700 dark:text-green-400">Success</h3>
                                                        <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                                                            Successfully uploaded {results.uploadedImages} images across {results.success} locations.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                This process will:
                            </p>
                            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                <li>Upload all location images to Supabase Storage</li>
                                <li>Update location records with new image URLs</li>
                                <li>Maintain the original images if upload fails</li>
                                <li>Process images in batches to prevent timeouts</li>
                            </ul>
                        </div>
                    </>
                )}
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleUpload}
                    disabled={isUploading || isLoading || !locations?.length || !user}
                    className="w-full"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading Images...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Images
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}