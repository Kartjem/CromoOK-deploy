import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { migrateAllDemoLocationsToSupabase } from '@/hooks/useLocations';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuthContext } from '@/context/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function DataMigrationManager() {
    const [migrating, setMigrating] = useState(false);
    const [migrationResults, setMigrationResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [forceUpdate, setForceUpdate] = useState(false);
    const { toast } = useToast();
    const { user } = useAuthContext();

    const handleMigration = async () => {
        if (!user) {
            setError('You must be logged in to migrate data');
            toast({
                title: 'Authentication Required',
                description: 'You need to log in before migrating data to Supabase.',
                variant: 'destructive',
            });
            return;
        }

        setMigrating(true);
        setError(null);
        setMigrationResults(null);

        try {
            const results = await migrateAllDemoLocationsToSupabase(forceUpdate);
            setMigrationResults(results);

            if ('error' in results && results.error) {
                setError(results.error);
                toast({
                    title: 'Migration Error',
                    description: results.error,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Migration Complete',
                    description: `Successfully migrated ${results.success} locations to Supabase.`,
                    variant: 'default',
                });
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred');
            toast({
                title: 'Migration Failed',
                description: err.message || 'An unknown error occurred',
                variant: 'destructive',
            });
        } finally {
            setMigrating(false);
        }
    };

    const totalLocations = migrationResults ? migrationResults.success + migrationResults.failed + migrationResults.skipped : 0;
    const successPercentage = totalLocations > 0 ? (migrationResults.success / totalLocations) * 100 : 0;

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Migrate Demo Data to Supabase</CardTitle>
                <CardDescription>
                    Transfer demo locations and images to your Supabase database. This helps you start with pre-populated data.
                </CardDescription>
            </CardHeader>
            <CardContent>
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

                {migrationResults && !error && (
                    <div className="space-y-4 mb-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Migration progress</span>
                                <span>{Math.round(successPercentage)}%</span>
                            </div>
                            <Progress value={successPercentage} className="h-2" />
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{migrationResults.success}</p>
                                <p className="text-sm text-muted-foreground">Successful</p>
                            </div>
                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{migrationResults.skipped}</p>
                                <p className="text-sm text-muted-foreground">Skipped</p>
                            </div>
                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{migrationResults.failed}</p>
                                <p className="text-sm text-muted-foreground">Failed</p>
                            </div>
                        </div>

                        {migrationResults.success > 0 && (
                            <div className="p-4 border border-green-200 rounded-lg bg-green-50 dark:border-green-900 dark:bg-green-950/50">
                                <div className="flex items-start">
                                    <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-medium text-green-700 dark:text-green-400">Success</h3>
                                        <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                                            Successfully migrated {migrationResults.success} locations to Supabase.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-2 mb-4">
                    <p className="text-sm text-muted-foreground">
                        This process will:
                    </p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        <li>Upload all demo location images to Supabase Storage</li>
                        <li>Create location records in your Supabase database</li>
                        <li>Link images to the appropriate locations</li>
                        <li>{forceUpdate ? 'Update' : 'Skip'} any locations that already exist in the database</li>
                    </ul>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                        id="forceUpdate"
                        checked={forceUpdate}
                        onCheckedChange={(checked) => setForceUpdate(checked === true)}
                    />
                    <Label
                        htmlFor="forceUpdate"
                        className="text-sm cursor-pointer"
                    >
                       Reload existing locations (force update)
                    </Label>
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleMigration}
                    disabled={migrating || !user}
                    className="w-full"
                >
                    {migrating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Migrating Data...
                        </>
                    ) : (
                        'Start Migration'
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}