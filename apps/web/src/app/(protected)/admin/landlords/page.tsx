'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import {
  Ban,
  BellRing,
  BrushCleaning,
  Building2,
  Camera,
  Check,
  Clock,
  Crown,
  Droplets,
  Eye,
  MapPin,
  MoreHorizontal,
  Percent,
  ShieldCheck,
  Shirt,
  Users,
  Utensils,
  Wifi,
  Wind,
  Zap
} from 'lucide-react';
import { type DateRange } from 'react-day-picker';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/shared/shadcn/alert-dialog';
import { Badge } from '~/shared/shadcn/badge';
import { Button } from '~/shared/shadcn/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '~/shared/shadcn/carousel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/shared/shadcn/dropdown-menu';

import { CustomDialog } from '~/components/custom-dialog';
import { DataTable } from '~/components/datatable';
import PulseCard from '~/components/pulsecard';
import { trpcClient } from '~/utils/trpc';

import type { ColumnDef } from '@tanstack/react-table';
import type { PulseCardProps } from '~/components/pulsecard';

interface RoomType {
  capacity: number;
  roomPrice: number;
  personPrice: number;
  rooms: number;
}

export interface Landlord {
  id: string;
  userId: string;
  landlordName: string;
  inchargeName: string;
  phoneNumber: string;
  email?: string;
  city: string;
  address: string;
  pincode: string | number;
  state: string;
  googleUrl: string;
  roomTypes: RoomType[];
  additionalInfo: string;
  electricity24x7: boolean;
  hotWater: boolean;
  wifi: boolean;
  acSupport: boolean;
  powerBackup: boolean;
  lift: boolean;
  parking: boolean;
  food: boolean;
  laundry: boolean;
  housekeeping: boolean;
  cctv: boolean;
  isFrozen: boolean;
  freezeReason?: string | null;
  thumbnail?: string;
  createdAt: Date;
  status: 'Active' | 'Pending Renewal' | 'Frozen';
  startDate: Date;
  endDate: Date;
}

interface LandlordStats {
  totalLandlordAccounts: number;
  convertedLandlordAccounts: number;
}

type RawLandlord = Omit<Landlord, 'createdAt' | 'startDate' | 'endDate'> & {
  createdAt: string;
  startDate: string;
  endDate: string;
};

interface LandlordsApiResponse {
  landlords?: RawLandlord[];
  stats?: LandlordStats;
}

const columns: ColumnDef<Landlord>[] = [
  {
    id: 'sno',
    header: () => <div className="w-5 text-center">S.No</div>,
    cell: ({ row }) => <div className="text-center">{row.index + 1}</div>
  },
  {
    accessorKey: 'details',
    header: 'Details',
    cell: ({ row }) => {
      const name = row.original.landlordName;
      const incharge = row.original.inchargeName;
      const phoneno = row.original.phoneNumber;
      const email = row.original.email;
      const joined = row.original.createdAt;
      return (
        <div className="text-md flex min-w-[150px] flex-col gap-2 whitespace-normal">
          <span className="font-bold">{name}</span>
          <span className="font-medium">{incharge}</span>
          <span>{phoneno}</span>
          {email && <span>{email}</span>}
          <span className="text-muted-foreground text-sm">
            Joined:{' '}
            {joined.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'address',
    header: 'Address',
    cell: ({ row }) => {
      const landlord = row.original;
      return (
        <div className="text-md flex min-w-[200px] flex-col gap-2 font-medium whitespace-normal">
          <Link className="text-green-600 hover:underline" href={landlord.googleUrl}>
            View on google maps ↗
          </Link>
          <span className="text-foreground/80">{landlord.address},</span>
          <div>
            <span>{landlord.city},</span>
            <span> {landlord.state},</span>
          </div>
          <span>{landlord.pincode}</span>
        </div>
      );
    }
  },
  {
    header: 'Amenities',
    id: 'amenities',
    cell: ({ row }) => {
      const {
        electricity24x7,
        hotWater,
        wifi,
        acSupport,
        powerBackup,
        lift,
        parking,
        food,
        laundry,
        housekeeping,
        cctv
      } = row.original;
      return (
        <div className="flex max-w-[300px] min-w-[200px] flex-wrap items-center justify-start gap-2 whitespace-normal">
          {electricity24x7 && (
            <Badge
              variant="secondary"
              className="flex items-center gap-2 px-2 py-1 text-[12px] [&>svg]:h-4 [&>svg]:w-4">
              <Zap className="text-primary shrink-0" />
              24×7 Electricity
            </Badge>
          )}

          {hotWater && (
            <Badge
              variant="secondary"
              className="flex items-center gap-2 px-2 py-1 text-[12px] [&>svg]:h-4 [&>svg]:w-4">
              <Droplets className="text-primary shrink-0" />
              Hot / Heated Water
            </Badge>
          )}

          {wifi && (
            <Badge
              variant="secondary"
              className="flex items-center gap-2 px-2 py-1 text-[12px] [&>svg]:h-4 [&>svg]:w-4">
              <Wifi className="text-primary shrink-0" />
              Wi-Fi
            </Badge>
          )}

          {acSupport && (
            <Badge
              variant="secondary"
              className="flex items-center gap-2 px-2 py-1 text-[12px] [&>svg]:h-4 [&>svg]:w-4">
              <Wind className="text-primary shrink-0" />
              AC
            </Badge>
          )}

          {powerBackup && (
            <Badge
              variant="secondary"
              className="flex items-center gap-2 px-2 py-1 text-[12px] [&>svg]:h-4 [&>svg]:w-4">
              <ShieldCheck className="text-primary shrink-0" />
              Power Backup
            </Badge>
          )}

          {lift && (
            <Badge
              variant="secondary"
              className="flex items-center gap-2 px-2 py-1 text-[12px] [&>svg]:h-4 [&>svg]:w-4">
              <Building2 className="text-primary shrink-0" />
              Lift
            </Badge>
          )}

          {parking && (
            <Badge
              variant="secondary"
              className="flex items-center gap-2 px-2 py-1 text-[12px] [&>svg]:h-4 [&>svg]:w-4">
              <MapPin className="text-primary shrink-0" />
              Parking
            </Badge>
          )}

          {food && (
            <Badge
              variant="secondary"
              className="flex items-center gap-2 px-2 py-1 text-[12px] [&>svg]:h-4 [&>svg]:w-4">
              <Utensils className="text-primary shrink-0" />
              Food
            </Badge>
          )}

          {laundry && (
            <Badge
              variant="secondary"
              className="flex items-center gap-2 px-2 py-1 text-[12px] [&>svg]:h-4 [&>svg]:w-4">
              <Shirt className="text-primary shrink-0" />
              Laundry
            </Badge>
          )}

          {housekeeping && (
            <Badge
              variant="secondary"
              className="flex items-center gap-2 px-2 py-1 text-[12px] [&>svg]:h-4 [&>svg]:w-4">
              <BrushCleaning className="text-primary shrink-0" />
              Housekeeping
            </Badge>
          )}

          {cctv && (
            <Badge
              variant="secondary"
              className="flex items-center gap-2 px-2 py-1 text-[12px] [&>svg]:h-4 [&>svg]:w-4">
              <Camera className="text-primary shrink-0" />
              CCTV
            </Badge>
          )}
        </div>
      );
    }
  },
  {
    header: 'Rooms & Pricing',
    id: 'Rooms & Pricing',
    cell: ({ row }) => {
      const roomTypes = row.original.roomTypes;

      const sortedRooms = roomTypes.sort((a, b) => a.capacity - b.capacity);
      const visibleRooms = sortedRooms.slice(0, 3);
      const hasMore = roomTypes.length > 3;

      const [openRoomsDialog, setOpenRoomsDialog] = React.useState(false);

      return (
        <div className="flex w-[130px] flex-col gap-3 whitespace-normal">
          {/* LIST */}
          <ul className="flex flex-col gap-2">
            {visibleRooms.map((room) => (
              <li
                key={room.capacity}
                className="flex flex-col gap-1 border-b pb-2 last:border-b-0 last:pb-0">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold">
                    {room.capacity === 1 ? 'Single' : `${room.capacity}-Sharing`}
                  </span>
                  <span className="text-muted-foreground text-[12px] font-medium">
                    {room.rooms} rooms
                  </span>
                </div>

                {/* Pricing */}
                <ul className="flex flex-col gap-1">
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[12px]">Price</span>
                    <span className="text-foreground text-xs font-bold">
                      ₹{room.roomPrice.toLocaleString()}
                    </span>
                  </li>
                </ul>
              </li>
            ))}
          </ul>

          {/* Dialog */}
          {openRoomsDialog && (
            <CustomDialog
              open={openRoomsDialog}
              onOpenChange={setOpenRoomsDialog}
              title={`Rooms & Pricing — ${row.original.landlordName}`}>
              <ul className="flex flex-col gap-4">
                {sortedRooms.map((room) => (
                  <li
                    key={room.capacity}
                    className="flex flex-col gap-1 border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="h-5 px-2 text-[12px] font-bold">
                        {room.capacity === 1 ? 'Single' : `${room.capacity}-Sharing`}
                      </Badge>
                      <span className="text-muted-foreground text-[14px] font-medium">
                        {room.rooms} units
                      </span>
                    </div>

                    <ul className="flex flex-col gap-1">
                      <li className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[14px]">Price</span>
                        <span className="text-foreground text-sm font-bold">
                          ₹{room.roomPrice.toLocaleString()}
                        </span>
                      </li>
                    </ul>
                  </li>
                ))}
              </ul>
            </CustomDialog>
          )}

          {/* View all */}
          {hasMore && (
            <Button
              variant="link"
              onClick={() => setOpenRoomsDialog(true)}
              className="text-primary h-auto p-0 text-sm">
              View all
            </Button>
          )}
        </div>
      );
    }
  },

  {
    accessorKey: 'Info & Subscription',
    header: 'Info & Subscription',
    cell: ({ row }) => {
      const status = row.original.status;
      const isPending = status === 'Pending Renewal';
      const isFrozen = status === 'Frozen';
      const info = row.original.additionalInfo?.trim();
      return (
        <div className="flex min-w-[200px] flex-col gap-3 text-sm whitespace-normal">
          {info && (
            <div className="relative">
              {info.length > 75 ? (
                <>
                  <input type="checkbox" id={`expanded-toggle-${row.id}`} className="peer hidden" />
                  <span className="text-foreground line-clamp-3 transition-all peer-checked:line-clamp-none">
                    {info}
                  </span>
                  <label
                    htmlFor={`expanded-toggle-${row.id}`}
                    className="block cursor-pointer font-medium text-orange-600 peer-checked:hidden hover:underline">
                    View more
                  </label>
                  <label
                    htmlFor={`expanded-toggle-${row.id}`}
                    className="hidden cursor-pointer font-medium text-orange-600 peer-checked:block hover:underline">
                    View less
                  </label>
                </>
              ) : (
                <span>{info}</span>
              )}
            </div>
          )}

          {/* Status & Action Row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={`px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase ${
                isFrozen
                  ? 'border-slate-200 bg-slate-100 text-slate-700'
                  : isPending
                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                    : 'border-emerald-100 bg-emerald-50 text-emerald-700'
              }`}>
              {status}
            </Badge>

            {isPending && (
              <Button
                className="bg-primary/10 hover:bg-primary/20 text-primary h-7 gap-1 px-2 text-xs font-medium"
                onClick={() => alert(`Notification sent to ${row.original.landlordName}`)}>
                <BellRing size={12} />
                Notify
              </Button>
            )}
          </div>

          <div className="bg-muted/40 border-border/50 flex max-w-[200px] flex-col gap-1.5 rounded-lg border p-2.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">Starts</span>
              <span className="text-foreground font-bold">
                {row.original.startDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">Ends</span>
              <span className="text-foreground font-bold">
                {row.original.endDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: 'images',
    header: 'Images',
    cell: ({ row }) => (
      <Carousel className="w-full max-w-[100px]">
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Image
                  src={row.original.thumbnail || '/assets/placeholder.png'}
                  alt={`Slide ${index + 1}`}
                  width={96}
                  height={72}
                  className="rounded-lg object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex items-center justify-center gap-4 py-4">
          <CarouselPrevious className="static translate-y-0" />
          <CarouselNext className="static translate-y-0" />
        </div>
      </Carousel>
    )
  },
  {
    id: 'actions',
    header: '',
    cell: () => null
  }
];

function LandlordRowActions({
  landlord,
  onToggleFreeze
}: {
  landlord: Landlord;
  onToggleFreeze: (landlord: Landlord) => void;
}) {
  const freezeLabel = landlord.isFrozen ? 'Unfreeze Landlord' : 'Freeze Landlord';
  const dialogTitle = landlord.isFrozen ? 'Unfreeze Landlord' : 'Freeze Landlord';
  const dialogDescription = landlord.isFrozen
    ? `Do you want to unfreeze ${landlord.landlordName}?`
    : `Do you want to freeze ${landlord.landlordName}? Frozen accounts cannot access landlord operations.`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              variant={landlord.isFrozen ? 'default' : 'destructive'}
              onSelect={(e) => e.preventDefault()}>
              {landlord.isFrozen ? (
                <Check className="mr-1 size-4" />
              ) : (
                <Ban className="mr-1 size-4" />
              )}
              {freezeLabel}
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button onClick={() => onToggleFreeze(landlord)}>
                  {landlord.isFrozen ? 'Unfreeze' : 'Freeze'}
                </Button>
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const pulseData: PulseCardProps[] = [
  {
    label: 'Total Landlords',
    value: 100,
    sub: 'No of Landlords onboarded',
    button: 'Add+',
    buttonLink: '#',
    color: 'green',
    icon: Building2
  },
  {
    label: 'Pending Renewals',
    value: 12,
    sub: 'Requires Action',
    button: 'Notify',
    buttonOnClick: () => alert(`Notifies all`),
    color: 'red',
    icon: Clock
  },
  {
    label: 'Conversion Rate',
    value: '90 %',
    sub: 'Out of total accounts',
    trend: 'up',
    color: 'blue',
    icon: Percent
  },
  {
    label: 'Total Capacity',
    value: 12000,
    sub: 'Total listed capacity',
    color: 'indigo',
    icon: Users
  }
];

export default function page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [landlordStats, setLandlordStats] = useState<LandlordStats>({
    totalLandlordAccounts: 0,
    convertedLandlordAccounts: 0
  });
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined
  });

  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchLandlords = async () => {
      setIsLoading(true);
      try {
        const payload = (await trpcClient.admin.listLandlords.query({
          q: debouncedSearch || undefined
        })) as RawLandlord[] | LandlordsApiResponse;

        const payloadLandlords = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.landlords)
            ? payload.landlords
            : [];
        const payloadStats = Array.isArray(payload) ? null : payload.stats;

        const mapped = payloadLandlords.map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          startDate: new Date(item.startDate),
          endDate: new Date(item.endDate)
        }));

        const seenLandlordAccounts = new Set<string>();
        const deduped = mapped.filter((item) => {
          const landlordAccountKey = item.userId || item.id;
          if (seenLandlordAccounts.has(landlordAccountKey)) return false;
          seenLandlordAccounts.add(landlordAccountKey);
          return true;
        });

        setLandlords(deduped);
        setLandlordStats({
          totalLandlordAccounts: payloadStats?.totalLandlordAccounts ?? deduped.length,
          convertedLandlordAccounts: payloadStats?.convertedLandlordAccounts ?? deduped.length
        });
      } catch {
        setLandlords([]);
        setLandlordStats({
          totalLandlordAccounts: 0,
          convertedLandlordAccounts: 0
        });
        toast.error('Could not fetch landlords right now. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLandlords();
  }, [debouncedSearch]);

  const handleToggleFreeze = async (landlord: Landlord) => {
    try {
      await trpcClient.admin.setLandlordFreeze.mutate({
        id: landlord.id,
        isFrozen: !landlord.isFrozen,
        freezeReason: !landlord.isFrozen
          ? 'Your account has been frozen by admin. Please contact support.'
          : undefined
      });

      setLandlords((prev) =>
        prev.map((item) =>
          item.id === landlord.id
            ? {
                ...item,
                isFrozen: !landlord.isFrozen,
                freezeReason: !landlord.isFrozen
                  ? 'Your account has been frozen by admin. Please contact support.'
                  : null,
                status: !landlord.isFrozen
                  ? 'Frozen'
                  : item.endDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    ? 'Pending Renewal'
                    : 'Active'
              }
            : item
        )
      );
      toast.success(landlord.isFrozen ? 'Landlord unfrozen' : 'Landlord frozen');
    } catch {
      toast.error('Could not update landlord status right now. Please try again.');
    }
  };

  const columnsWithActions = useMemo<ColumnDef<Landlord>[]>(() => {
    return columns.map((column) => {
      if (column.id !== 'actions') return column;
      return {
        ...column,
        cell: ({ row }) => (
          <LandlordRowActions landlord={row.original} onToggleFreeze={handleToggleFreeze} />
        )
      };
    });
  }, [handleToggleFreeze]);

  const filteredData =
    filter && filter !== '' ? landlords.filter((item) => item.status === filter) : landlords;

  const cards = useMemo<PulseCardProps[]>(() => {
    const pendingRenewals = landlords.filter(
      (landlord) => landlord.status === 'Pending Renewal'
    ).length;
    const totalCapacity = landlords.reduce((sum, landlord) => {
      return (
        sum +
        landlord.roomTypes.reduce((capacitySum, roomType) => {
          return capacitySum + roomType.capacity * roomType.rooms;
        }, 0)
      );
    }, 0);
    const convertedLandlordAccounts = landlordStats.convertedLandlordAccounts;
    const totalLandlordAccounts = landlordStats.totalLandlordAccounts;
    const conversionRate =
      totalLandlordAccounts > 0
        ? Math.round((convertedLandlordAccounts / totalLandlordAccounts) * 100)
        : 0;

    return pulseData.map((card) => {
      if (card.label === 'Total Landlords') return { ...card, value: totalLandlordAccounts };
      if (card.label === 'Pending Renewals') return { ...card, value: pendingRenewals };
      if (card.label === 'Conversion Rate')
        return {
          ...card,
          value: `${conversionRate}%`,
          sub: `${convertedLandlordAccounts}/${totalLandlordAccounts} landlord accounts created at least one property`
        };
      if (card.label === 'Total Capacity') return { ...card, value: totalCapacity };
      return card;
    });
  }, [landlords, landlordStats]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-2 p-4 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">Overview</h1>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {cards.map((card, index) => (
            <PulseCard key={index} {...card} isLoading={isLoading} />
          ))}
        </div>
      </div>
      <div className="box-border flex w-full flex-col gap-2 overflow-hidden p-4 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">All landlords</h1>
        <DataTable
          columns={columnsWithActions}
          data={filteredData}
          searchPlaceholder="Search by name, phone, city or any..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          serverSideSearch={true}
          isLoading={isLoading}
          dateRange={range}
          setDateRange={setRange}
          filters={{
            value: filter,
            options: [
              { label: 'Active', value: 'Active', icon: Crown },
              { label: 'Pending Renewals', value: 'Pending Renewal', icon: Clock },
              { label: 'Frozen', value: 'Frozen', icon: Ban },
              { label: 'Show All', value: '', icon: Eye }
            ],
            onChange: (val) => setFilter(val as string)
          }}
        />
      </div>{' '}
    </div>
  );
}
