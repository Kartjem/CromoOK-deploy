import { useState, useEffect } from 'react';
import { AlertCircle, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDeleteLocation } from '@/hooks/useLocations';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface DeleteLocationDialogProps {
    locationId: string;
    locationTitle: string;
    isOwner: boolean;
    isOpen?: boolean;
    onClose?: () => void;
}

export function DeleteLocationDialog({
    locationId,
    locationTitle,
    isOwner,
    isOpen: externalIsOpen,
    onClose
}: DeleteLocationDialogProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const deleteLocation = useDeleteLocation();
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const isControlled = externalIsOpen !== undefined;
    const isOpen = isControlled ? externalIsOpen : internalIsOpen;

    useEffect(() => {
        return () => {
            if (isControlled && onClose) {
                onClose();
            } else {
                setInternalIsOpen(false);
            }
        };
    }, [isControlled, onClose]);

    const setIsOpen = (open: boolean) => {
        if (!isControlled) {
            setInternalIsOpen(open);
        } else if (!open && onClose) {
            onClose();
        }
    };

    if (!isOwner) {
        return null;
    }

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteLocation.mutateAsync(locationId, {
                onSuccess: () => {
                    setIsOpen(false);
                    window.history.back();
                },
                onError: (error) => {
                    setIsOpen(false);
                    window.history.back();
                    console.error("Error deleting location", error);
                }
            });
            toast({
                title: 'Location Deleted',
                description: `Location "${locationTitle}" has been successfully deleted`,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to delete location',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
            if (isMobile && isOpen) {
                setTimeout(() => {
                    setIsOpen(false);
                }, 100);
            } else {
                setIsOpen(false);
            }
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            {!isControlled && (
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                        <Trash className="h-4 w-4" />
                        Delete Location
                    </Button>
                </AlertDialogTrigger>
            )}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        Delete Location
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete location "{locationTitle}"? This action cannot be undone,
                        and all location data, including images, will be permanently deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}