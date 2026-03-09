'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import {
  AirVent,
  BrushCleaning,
  Camera,
  Check,
  DoorOpen,
  Hand,
  Loader2,
  MapPin,
  MapPinned,
  PencilLine,
  Phone,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Utensils,
  Wifi,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/shared/shadcn/alert-dialog';
import { Button } from '~/shared/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/shared/shadcn/card';

import {
  isSafeLandlordImageSrc,
  LandlordImageFallback
} from '~/components/shared/landlord-image-fallback';
import { PropertyImageCarousel } from '~/components/user-dashboard/property-image-carousel';
import { createPropertyScopedTrpcClient, trpcClient } from '~/utils/trpc';

type PropertySummaryResponse = {
  hasProperty: boolean;
  isFrozen?: boolean;
  freezeReason?: string;
  selectedProperty?: {
    id: string;
    name: string;
    isFrozen?: boolean;
    freezeReason?: string | null;
    deletionScheduledFor?: string | null;
  };
  details?: {
    name: string;
    type: string | null;
    inchargeName: string | null;
    inchargePhone: string | null;
    addressLine1: string | null;
    area: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    mapsLink: string | null;
    landmarks: string[] | null;
    rules: string[] | null;
    roomTypes: string[];
    rents: Record<string, string>;
    facilities: Record<string, boolean>;
    totalCapacity: number;
    photos: string[] | null;
  } | null;
};

const getFacilityIcon = (key: string) => {
  const iconProps = {
    size: 18,
    className: 'text-primary shrink-0'
  };

  switch (key) {
    case 'electricity':
      return <Zap {...iconProps} />;
    case 'hotWater':
      return <Utensils {...iconProps} />;
    case 'wifi':
      return <Wifi {...iconProps} />;
    case 'ac':
      return <AirVent {...iconProps} />;
    case 'powerBackup':
      return <Zap {...iconProps} />;
    case 'food':
      return <Utensils {...iconProps} />;
    case 'housekeeping':
      return <BrushCleaning {...iconProps} />;
    case 'cctv':
      return <Camera {...iconProps} />;
    default:
      return <Check {...iconProps} />;
  }
};

const getFacilityLabel = (key: string) => {
  const labels: Record<string, string> = {
    electricity: '24x7 Power',
    hotWater: 'Hot Water',
    wifi: 'Free Wi-Fi',
    ac: 'AC Rooms',
    powerBackup: 'Power Backup',
    lift: 'Lift',
    parking: 'Parking',
    food: 'Food / Mess',
    laundry: 'Laundry',
    housekeeping: 'Housekeeping',
    cctv: 'CCTV Security'
  };
  return labels[key] || key;
};

export default function LandlordPropertyPage() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery<PropertySummaryResponse>({
    queryKey: ['landlord-property-summary'],
    queryFn: async (): Promise<PropertySummaryResponse> => {
      const properties = await trpcClient.property.getAllProperties.query();
      if (properties.length === 0) {
        return { hasProperty: false };
      }

      const selectedProperty = properties[0];
      if (selectedProperty.isFrozen) {
        return {
          hasProperty: true,
          isFrozen: true,
          freezeReason: selectedProperty.freezeReason || 'This account has been frozen by admin.',
          selectedProperty,
          details: null
        };
      }

      const propertyClient = createPropertyScopedTrpcClient(selectedProperty.id);
      const rawDetails = await propertyClient.property.getPropertyDetails.query();
      const rawFacilities = rawDetails?.facilities;
      const details = rawDetails
        ? {
            name: rawDetails.name,
            type: rawDetails.type,
            inchargeName: rawDetails.inchargeName,
            inchargePhone: rawDetails.inchargePhone,
            addressLine1: rawDetails.addressLine1,
            area: rawDetails.area,
            city: rawDetails.city,
            state: rawDetails.state,
            pincode: rawDetails.pincode,
            mapsLink: rawDetails.mapsLink,
            landmarks: rawDetails.landmarks,
            rules: rawDetails.rules,
            roomTypes: rawDetails.roomTypes,
            rents: rawDetails.rents,
            facilities: {
              electricity: Boolean(rawFacilities?.electricity),
              hotWater: Boolean(rawFacilities?.hotWater),
              wifi: Boolean(rawFacilities?.wifi),
              ac: Boolean(rawFacilities?.ac),
              powerBackup: Boolean(rawFacilities?.powerBackup),
              lift: Boolean(rawFacilities?.lift),
              parking: Boolean(rawFacilities?.parking),
              food: Boolean(rawFacilities?.food),
              laundry: Boolean(rawFacilities?.laundry),
              housekeeping: Boolean(rawFacilities?.housekeeping),
              cctv: Boolean(rawFacilities?.cctv)
            },
            totalCapacity: rawDetails.totalCapacity,
            photos: rawDetails.photos
          }
        : null;

      return {
        hasProperty: true,
        isFrozen: false,
        selectedProperty,
        details
      };
    }
  });

  const enabledFacilities = useMemo(() => {
    if (!data?.details?.facilities) return [];
    return Object.entries(data.details.facilities)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key);
  }, [data]);

  const scheduledDeletionDate = useMemo(() => {
    const value = data?.selectedProperty?.deletionScheduledFor;
    if (!value) return null;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [data?.selectedProperty?.deletionScheduledFor]);

  const scheduledDeletionLabel = useMemo(() => {
    if (!scheduledDeletionDate) return null;
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(scheduledDeletionDate);
  }, [scheduledDeletionDate]);

  const handleDeleteProperty = async () => {
    if (!data?.selectedProperty?.id) return;

    setIsDeleting(true);
    try {
      const propertyClient = createPropertyScopedTrpcClient(data.selectedProperty.id);
      const result = await propertyClient.property.deleteProperty.mutate();
      const scheduledFor = result?.scheduledFor ? new Date(result.scheduledFor) : null;
      const formattedScheduledFor =
        scheduledFor && !Number.isNaN(scheduledFor.getTime())
          ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
              scheduledFor
            )
          : '3 days';

      if (result?.alreadyScheduled) {
        toast.success(`Property deletion is already scheduled for ${formattedScheduledFor}.`);
      } else {
        toast.success(`Property deletion scheduled for ${formattedScheduledFor}.`);
      }
      setIsDeleteDialogOpen(false);
      await refetch();
      router.refresh();
    } catch {
      toast.error('Could not schedule property deletion right now. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelPropertyDeletion = async () => {
    if (!data?.selectedProperty?.id) return;

    setIsCancellingDeletion(true);
    try {
      const propertyClient = createPropertyScopedTrpcClient(data.selectedProperty.id);
      await propertyClient.property.cancelPropertyDeletion.mutate();
      toast.success('Property deletion cancelled.');
      await refetch();
      router.refresh();
    } catch {
      toast.error('Could not cancel property deletion right now. Please try again.');
    } finally {
      setIsCancellingDeletion(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 sm:gap-5">
        <Card className="flex w-full flex-1 flex-col justify-center rounded-3xl border shadow-sm">
          <CardContent className="flex items-center justify-center gap-2 py-10 text-sm sm:text-base">
            <Loader2 className="size-4 animate-spin sm:size-5" />
            Loading property details...
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!data?.hasProperty || !data.details) {
    if (data?.hasProperty && data?.isFrozen) {
      return (
        <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 p-4 sm:gap-5 sm:p-6">
          <Card className="flex w-full flex-1 flex-col justify-center rounded-3xl border shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="text-base font-semibold sm:text-lg">Account Frozen</p>
              <p className="text-muted-foreground max-w-xl text-sm">
                {data?.freezeReason ||
                  'Your account has been frozen by admin. Please contact support for assistance.'}
              </p>
            </CardContent>
          </Card>
        </main>
      );
    }

    return (
      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 p-4 sm:gap-5 sm:p-6">
        <Card className="flex w-full flex-1 flex-col justify-center rounded-3xl border shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-base font-semibold sm:text-lg">No property found</p>
            <p className="text-muted-foreground text-sm">
              You don&apos;t have a listed property yet. Start onboarding to add your first
              property.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/landlord/onboarding">Add Property</Link>
              </Button>
              <Button variant="outline" onClick={() => refetch()} className="w-full sm:w-auto">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const detail = data.details;
  const address = [detail.addressLine1, detail.area, detail.city, detail.state, detail.pincode]
    .filter(Boolean)
    .join(', ');
  const images = detail.photos?.length ? detail.photos : [''];

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 sm:gap-5">
      <div className="bg-primary/95 text-primary-foreground flex items-center gap-4 rounded-3xl px-4 py-4 sm:mb-3 sm:px-5">
        <div className="bg-primary-foreground/20 rounded-xl p-2.5">
          <Hand className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">Hello, {detail.inchargeName || 'Landlord'}!</p>
          <p className="text-primary-foreground/85 text-xs sm:text-sm">
            Welcome back. Here&apos;s a clear view of your property.
          </p>
        </div>
      </div>

      {scheduledDeletionDate && scheduledDeletionLabel ? (
        <Card className="border-destructive/30 bg-destructive/5 rounded-3xl shadow-sm">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">
              Property deletion is scheduled for {scheduledDeletionLabel}. You can cancel before
              this time.
            </p>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 w-full sm:w-auto"
              onClick={handleCancelPropertyDeletion}
              disabled={isCancellingDeletion}>
              {isCancellingDeletion ? 'Cancelling...' : 'Cancel Deletion'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="overflow-hidden rounded-3xl border shadow-sm">
        <div className="md:hidden">
          <PropertyImageCarousel images={images} propertyName={detail.name} />
        </div>

        <div className="hidden h-[460px] gap-3 overflow-hidden md:grid md:grid-cols-4 md:grid-rows-2">
          <div className="group relative col-span-2 row-span-2 h-full w-full overflow-hidden">
            {isSafeLandlordImageSrc(images[0]) ? (
              <Image
                src={images[0]}
                alt={detail.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <LandlordImageFallback className="h-full w-full" />
            )}
          </div>
          {images.slice(1, 5).map((image, index) => (
            <div
              key={`${image}-${index}`}
              className={`group relative h-full w-full overflow-hidden ${
                index === 0 && images.length === 2 ? 'col-span-2 row-span-2' : ''
              }`}>
              {isSafeLandlordImageSrc(image) ? (
                <Image
                  src={image}
                  alt={`${detail.name} image ${index + 2}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="25vw"
                />
              ) : (
                <LandlordImageFallback className="h-full w-full" />
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-3 sm:gap-5 lg:grid-cols-3">
        <Card className="rounded-3xl border shadow-sm lg:col-span-2">
          <CardContent className="space-y-7">
            <div className="space-y-3">
              <h2 className="text-xl font-bold tracking-tight md:text-2xl lg:text-4xl">
                {detail.name}
              </h2>
              <div className="flex flex-col items-start gap-3">
                <div className="text-muted-foreground flex gap-1 text-sm font-medium lg:text-base">
                  <MapPin className="text-primary mt-0.5 size-4 shrink-0 sm:size-5" />
                  <span className="leading-relaxed">{address || 'N/A'}</span>
                </div>
                {detail.mapsLink ? (
                  <Link
                    href={detail.mapsLink}
                    className="text-primary inline-flex items-center gap-1.5 text-sm hover:underline lg:text-base">
                    View on Google Maps <TrendingUp className="size-4" />
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="bg-muted/30 flex items-center gap-3 rounded-2xl border px-4 py-4">
              <div className="bg-primary/10 rounded-xl p-2.5">
                <Phone className="text-primary size-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                  Contact
                </span>
                <span className="text-sm font-semibold lg:text-base">
                  {detail.inchargePhone || 'N/A'}
                </span>
              </div>
            </div>

            <div className="border-border border-t" />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-base font-semibold lg:text-lg">
                <Zap size={18} className="text-primary" />
                <h3 className="text-base font-semibold tracking-tight lg:text-lg">Amenities</h3>
              </div>

              <div className="flex flex-wrap gap-5">
                {enabledFacilities.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No facilities added.</p>
                ) : (
                  enabledFacilities.map((facility) => (
                    <div
                      key={facility}
                      className="bg-card inline-flex items-center gap-2 rounded-xl text-[12px] font-medium lg:text-sm">
                      {getFacilityIcon(facility)}
                      <span className="text-foreground">{getFacilityLabel(facility)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-border border-t" />

            <div className="space-y-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold lg:text-lg">
                <ShieldCheck size={18} className="text-primary" />
                Property Rules
              </CardTitle>
              {detail.rules && detail.rules.length > 0 ? (
                <ul className="space-y-3">
                  {detail.rules.map((rule) => (
                    <li
                      key={rule}
                      className="text-foreground/85 flex items-start gap-3 text-sm lg:text-base">
                      <div className="bg-primary/60 mt-2 size-1.5 shrink-0 rounded-full" />
                      <span className="leading-relaxed">{rule}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm lg:text-base">No rules added.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="sticky top-24 flex flex-col gap-3 sm:gap-5">
          <Card className="gap-3 rounded-3xl border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold lg:text-lg">
                <DoorOpen size={20} className="text-primary" />
                Sharing Types & Rent
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm lg:text-base">
              {detail.roomTypes.length === 0 ? (
                <p className="text-muted-foreground">No room types configured.</p>
              ) : (
                <ul className="space-y-3">
                  {detail.roomTypes.map((roomType) => (
                    <li key={roomType} className="flex items-center justify-between gap-3">
                      <span className="leading-relaxed">{roomType}</span>
                      <span>—</span>
                      <span className="font-semibold lg:text-lg">
                        ₹{detail.rents[roomType] || '0'}{' '}
                        <span className="text-muted-foreground text-xs font-normal lg:text-sm">
                          / Bed
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="gap-3 rounded-3xl border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold lg:text-lg">
                <MapPinned size={20} className="text-primary" />
                Nearby Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm lg:text-base">
              {detail.landmarks && detail.landmarks.length > 0 ? (
                <ul className="space-y-3">
                  {detail.landmarks.map((landmark) => (
                    <li
                      key={landmark}
                      className="text-foreground/85 flex items-start gap-3 text-sm lg:text-base">
                      <div className="bg-primary/60 mt-2 size-1.5 shrink-0 rounded-full" />
                      <span className="leading-relaxed">{landmark}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No nearby locations added.</p>
              )}
            </CardContent>
          </Card>

          <Card className="gap-3 rounded-3xl border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold lg:text-lg">Property Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-row flex-wrap justify-between gap-2">
              {scheduledDeletionDate ? (
                <Button variant="outline" className="flex-1 justify-start" disabled>
                  <PencilLine className="size-4" />
                  Edit Property
                </Button>
              ) : (
                <Button asChild variant="outline" className="flex-1 justify-start">
                  <Link
                    href="/landlord/onboarding?mode=edit"
                    className="inline-flex items-center gap-2">
                    <PencilLine className="size-4" />
                    Edit Property
                  </Link>
                </Button>
              )}
              {scheduledDeletionDate ? (
                <Button
                  variant={'ghost'}
                  className="bg-destructive/20 text-destructive flex-1 justify-start"
                  onClick={handleCancelPropertyDeletion}
                  disabled={isCancellingDeletion}>
                  <Trash2 className="size-4" />
                  {isCancellingDeletion ? 'Cancelling...' : 'Cancel Deletion'}
                </Button>
              ) : (
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant={'ghost'}
                      className="bg-destructive/20 text-destructive flex-1 justify-start"
                      disabled={isDeleting}>
                      <Trash2 className="size-4" />
                      {isDeleting ? 'Scheduling...' : 'Delete Property'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Schedule Property Deletion?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This property will be deleted after 3 days. You can cancel deletion anytime
                      before the deadline.
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Keep Property</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteProperty} disabled={isDeleting}>
                        {isDeleting ? 'Scheduling...' : 'Yes, Schedule Deletion'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
