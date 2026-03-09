'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import {
  AirVent,
  ArrowLeft,
  BrushCleaning,
  Camera,
  Check,
  DoorOpen,
  Loader2,
  MapPin,
  MapPinned,
  Phone,
  ShieldCheck,
  TrendingUp,
  Utensils,
  Wifi,
  Zap
} from 'lucide-react';

import { Button } from '~/shared/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/shared/shadcn/card';

import {
  isSafeLandlordImageSrc,
  LandlordImageFallback
} from '~/components/shared/landlord-image-fallback';
import { PropertyImageCarousel } from '~/components/user-dashboard/property-image-carousel';
import { trpcHttp } from '~/utils/trpc';

const normalizeFacilityKey = (value: string) => {
  const key = value.toLowerCase().replace(/[\s-]/g, '');

  if (key.includes('wifi')) return 'wifi';
  if (key.includes('powerbackup')) return 'powerBackup';
  if (key.includes('electric')) return 'electricity';
  if (key.includes('hotwater') || key.includes('rowater') || key.includes('water'))
    return 'hotWater';
  if (key === 'ac' || key.includes('air')) return 'ac';
  if (key.includes('food') || key.includes('mess')) return 'food';
  if (key.includes('housekeeping') || key.includes('laundry')) return 'housekeeping';
  if (key.includes('cctv') || key.includes('security')) return 'cctv';

  return value;
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

export default function PropertyDetailPage() {
  const params = useParams<{ slug: string }>();

  const { data: property, isLoading } = useQuery(
    trpcHttp.publicProperty.bySlug.queryOptions({ slug: params.slug })
  );

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 sm:gap-5">
        <Card className="flex w-full flex-1 flex-col justify-center rounded-3xl border shadow-sm">
          <CardHeader className="items-center space-y-3 text-center">
            <Loader2 className="text-muted-foreground mx-auto size-5 animate-spin sm:size-6" />
            <CardTitle className="text-base sm:text-xl">Loading property...</CardTitle>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!property) {
    return (
      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 sm:gap-5">
        <Card className="flex w-full flex-1 flex-col justify-center rounded-3xl border shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-base font-semibold sm:text-lg">Property not found</p>
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const images = property.images.length > 0 ? property.images : [''];
  const hasAc = property.amenities.some((amenity) => normalizeFacilityKey(amenity) === 'ac');

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 sm:gap-5">
      <div className="hidden items-center justify-between md:flex">
        <Button
          asChild
          variant="ghost"
          className="hover:bg-primary/5 hover:text-primary rounded-xl transition-colors sm:text-lg">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="size-4 sm:size-5" />
            Back Home
          </Link>
        </Button>
      </div>

      <section className="overflow-hidden rounded-3xl border shadow-sm">
        <div className="md:hidden">
          <PropertyImageCarousel images={images} propertyName={property.name} />
        </div>

        <div className="hidden h-[460px] gap-3 overflow-hidden md:grid md:grid-cols-4 md:grid-rows-2">
          <div className="group relative col-span-2 row-span-2 h-full w-full overflow-hidden">
            {isSafeLandlordImageSrc(images[0]) ? (
              <Image
                src={images[0]}
                alt={property.name}
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
                  alt={`${property.name} image ${index + 2}`}
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
            <div className="-mx-2 space-y-3 sm:mx-0">
              <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-4xl">
                {property.name}
              </h1>
              <div className="flex flex-col items-start gap-3">
                <div className="text-muted-foreground flex gap-1 text-sm font-medium lg:text-base">
                  <MapPin className="text-primary mt-0.5 size-4 shrink-0 sm:size-5" />
                  <span className="leading-relaxed">{property.address}</span>
                </div>
                {property.mapUrl && (
                  <Link
                    href={property.mapUrl}
                    className="text-primary inline-flex items-center gap-1.5 text-sm hover:underline lg:text-base">
                    View on Google Maps <TrendingUp className="size-4" />
                  </Link>
                )}
              </div>
            </div>

            <div className="bg-muted/30 -mx-2 flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 sm:mx-0">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-xl p-2.5">
                  <Phone className="text-primary size-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                    Contact
                  </span>
                  <span className="text-sm font-semibold lg:text-base">{property.phoneNumber}</span>
                </div>
              </div>
              <Button asChild size="sm" className="shrink-0 rounded-xl">
                <Link
                  href={`tel:${property.phoneNumber}`}
                  aria-label={`Call ${property.phoneNumber}`}>
                  <Phone className="size-4.5 text-white" /> Call
                </Link>
              </Button>
            </div>

            <div className="border-border border-t" />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-base font-semibold lg:text-lg">
                <Zap size={18} className="text-primary" />
                <h2 className="text-base font-semibold tracking-tight lg:text-lg">Amenities</h2>
              </div>

              <div className="flex flex-wrap gap-5">
                {property.amenities.map((amenity) => {
                  const key = normalizeFacilityKey(amenity);
                  return (
                    <div
                      key={amenity}
                      className="bg-card inline-flex items-center gap-2 rounded-xl text-[12px] font-medium lg:text-sm">
                      {getFacilityIcon(key)}
                      <span className="text-foreground">{getFacilityLabel(key)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-border border-t" />

            <div className="space-y-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold lg:text-lg">
                <ShieldCheck size={18} className="text-primary" />
                Property Rules
              </CardTitle>
              {property.rules.length === 0 ? (
                <p className="text-muted-foreground text-sm lg:text-base">No rules added yet.</p>
              ) : (
                <ul className="space-y-3">
                  {property.rules.map((rule) => (
                    <li
                      key={rule}
                      className="text-foreground/85 flex items-start gap-3 text-sm lg:text-base">
                      <div className="bg-primary/60 mt-2 size-1.5 shrink-0 rounded-full" />
                      <span className="leading-relaxed">{rule}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="sticky top-24 flex flex-col gap-3 sm:gap-5">
          <Card className="gap-3 rounded-3xl border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold lg:text-lg">
                <DoorOpen size={20} className="text-primary" />
                Sharing Types Available
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm lg:text-base">
              {property.sharingTypes.length === 0 ? (
                <p className="text-muted-foreground">No sharing types available.</p>
              ) : (
                <div className="space-y-3">
                  <ul className="space-y-3">
                    {property.sharingTypes.map((sharingType) => (
                      <li
                        key={sharingType.type}
                        className="flex items-center justify-between gap-3">
                        <span className="leading-relaxed">{sharingType.type}</span>
                        <span>—</span>
                        <span className="font-semibold lg:text-lg">
                          ₹{sharingType.price}{' '}
                          <span className="text-muted-foreground text-xs font-normal lg:text-sm">
                            / Bed
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {hasAc && (
                    <p className="text-muted-foreground text-xs leading-relaxed lg:text-sm">
                      AC room prices may vary. Contact to confirm pricing.
                    </p>
                  )}
                </div>
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
              {property.landmarks.length === 0 ? (
                <p className="text-muted-foreground">No nearby locations added.</p>
              ) : (
                <ul className="space-y-3">
                  {property.landmarks.map((landmark) => (
                    <li
                      key={landmark}
                      className="text-foreground/85 flex items-start gap-3 text-sm lg:text-base">
                      <div className="bg-primary/60 mt-2 size-1.5 shrink-0 rounded-full" />
                      <span className="leading-relaxed">{landmark}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
