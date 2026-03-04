import Image from 'next/image';
import Link from 'next/link';

import { AirVent, BrushCleaning, Camera, Check, MapPin, Utensils, Wifi, Zap } from 'lucide-react';

import { Badge } from '~/shared/shadcn/badge';
import { Button } from '~/shared/shadcn/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/shared/shadcn/card';
import { Separator } from '~/shared/shadcn/separator';

import type { PublicPropertySummary } from '~/types/property';

type HostelCardProps = {
  hostel: Pick<
    PublicPropertySummary,
    'slug' | 'name' | 'location' | 'images' | 'amenities' | 'propertyType' | 'minPrice'
  >;
};

const propertyTypeLabelMap: Record<string, string> = {
  'boys-hostel': 'Boys Hostel',
  'girls-hostel': 'Girls Hostel',
  pg: 'PG',
  coliving: 'Coliving',
  apartments: 'Apartments'
};

const getSafeImageSrc = (src: string | undefined) => {
  if (!src || src.startsWith('file:') || src.startsWith('blob:')) {
    return '/assets/Full-Logo.jpeg';
  }
  return src;
};

const getFacilityIcon = (key: string) => {
  switch (key) {
    case 'electricity':
      return <Zap size={12} className="text-primary" />;
    case 'hotWater':
      return <Utensils size={12} className="text-primary" />;
    case 'wifi':
      return <Wifi size={12} className="text-primary" />;
    case 'ac':
      return <AirVent size={12} className="text-primary" />;
    case 'powerBackup':
      return <Zap size={12} className="text-primary" />;
    case 'food':
      return <Utensils size={12} className="text-primary" />;
    case 'housekeeping':
      return <BrushCleaning size={12} className="text-primary" />;
    case 'cctv':
      return <Camera size={12} className="text-primary" />;
    default:
      return <Check size={12} className="text-primary" />;
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

export function HostelCard({ hostel }: HostelCardProps) {
  return (
    <Card className="group md:hover:shadow-primary/10 gap-3 overflow-hidden rounded-3xl border pt-0 pb-4 shadow-sm transition-all duration-500 md:gap-4 md:pb-6 md:hover:-translate-y-1 md:hover:shadow-2xl">
      {' '}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={getSafeImageSrc(hostel.images[0])}
          alt={hostel.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <Badge
          variant="secondary"
          className="absolute right-3 bottom-3 rounded-xl border-none bg-[#ffffff] px-3 py-1 text-[10px] font-bold uppercase">
          {propertyTypeLabelMap[hostel.propertyType] ?? hostel.propertyType}
        </Badge>
      </div>
      <CardHeader className="gap-0 px-4 md:px-6">
        <CardTitle className="md:group-hover:text-primary line-clamp-1 text-xl font-bold transition-colors">
          {hostel.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-4 md:px-6">
        <div className="flex items-center gap-1 text-sm font-medium">
          <MapPin className="text-primary size-4" />
          <span className="text-foreground/90">{hostel.location}</span>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-2">
          {hostel.amenities.slice(0, 5).map((amenity) => {
            return (
              <Badge
                key={amenity}
                variant="outline"
                className="inline-flex items-center gap-1 rounded-lg bg-[#f9fafb] px-2 py-0.5 text-[12px] font-medium">
                {getFacilityIcon(amenity)}
                <span className="text-foreground/90">{getFacilityLabel(amenity)}</span>
              </Badge>
            );
          })}
          <span className="text-foreground/90 text-[13px] font-medium">+ more</span>
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-5 px-4 md:px-6">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-[10px] sm:text-xs">Starting from</span>
          <div className="flex flex-row items-center gap-0.5">
            <span className="text-md font-bold sm:text-lg">₹{hostel.minPrice} </span>
            <span className="sm:text-md text-muted-foreground text-sm font-medium">/</span>
            <span className="sm:text-md text-muted-foreground text-sm font-medium">bed</span>
          </div>
        </div>

        <Button asChild className="group-hover:shadow-primary/20 flex-1">
          <Link href={`/hostels/${hostel.slug}`}>View Full Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
