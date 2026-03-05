'use client';

import React, { useState } from 'react';
import Link from 'next/link';

import { Ban, Eye, Flame, Hash, MapPin, Star } from 'lucide-react';
import { type DateRange } from 'react-day-picker';

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

import { DataTable } from '~/components/datatable';
import ShortPulseCard from '~/components/short-pulsecard';

import type { ColumnDef } from '@tanstack/react-table';
import type { ShortPulseCardProps } from '~/components/short-pulsecard';

type PromotionType = 'featured' | 'trending' | 'location_spotlight';
type SessionType = 'active' | 'scheduled' | 'expired';

export interface Promotion {
  id: string;
  landlordName: string;
  phoneNumber: string;
  email?: string;
  city: string;
  address: string;
  pincode: string | number;
  state: string;
  googleUrl: string;
  promotionType: PromotionType;
  session: SessionType;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

const PROMOTION_BADGE_CONFIG: Record<
  PromotionType,
  {
    label: string;
    className: string;
    icon: React.ElementType;
  }
> = {
  featured: {
    label: 'Featured',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: Star
  },
  trending: {
    label: 'Trending',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: Flame
  },
  location_spotlight: {
    label: 'Location Spotlight',
    className: 'bg-green-50 text-green-700 border-green-200',
    icon: MapPin
  }
};

const renderPromotionBadge = (type: PromotionType) => {
  const config = PROMOTION_BADGE_CONFIG[type];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`flex w-fit items-center gap-1 px-2 py-1 text-[11px] font-bold uppercase ${config.className}`}>
      <Icon size={12} strokeWidth={2.5} /> {config.label}
    </Badge>
  );
};

// ------

const SESSION_BADGE_CONFIG: Record<
  SessionType,
  {
    label: string;
    className: string;
  }
> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  expired: {
    label: 'Expired',
    className: 'bg-gray-100 text-gray-500 border-gray-200'
  }
};

const renderSessionBadge = (type: SessionType) => {
  const config = SESSION_BADGE_CONFIG[type];

  return (
    <Badge
      variant="outline"
      className={`flex w-fit items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase ${config.className}`}>
      <span className="h-1 w-1 rounded-full bg-current" />
      {config.label}
    </Badge>
  );
};

const mockPromotions: Promotion[] = Array.from({ length: 20 }).map((_, index) => ({
  id: (index + 1).toString(),
  landlordName: 'Elite Supplies Co',
  phoneNumber: '9876543210',
  city: 'Mumbai',
  pincode: 500075,
  state: 'telangana',
  address: 'Gachibowli - Miyapur Rd, Kondapur, Whitefields, HITEC City',
  googleUrl:
    'https://www.google.com/maps/place/Sarath+City+Capital+Mall/@17.4545064,78.371805,15z/data=!3m1!5s0x3bcb93c8595a7705:0x39e105c426f80f70!4m6!3m5!1s0x3bcb93c8f42a1489:0x57fc4e27fb6901b2!8m2!3d17.4575952!4d78.3639493!16s%2Fg%2F11g8btzw00?entry=ttu&g_ep=EgoyMDI2MDEwNy4wIKXMDSoKLDEwMDc5MjA3MUgBUAM%3D',
  promotionType: 'trending',
  session: 'active',
  startDate: new Date('2024-01-15'),
  endDate: new Date('2024-01-15'),
  createdAt: new Date('2024-01-15')
}));

const columns: ColumnDef<Promotion>[] = [
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
      const phoneno = row.original.phoneNumber;
      const email = row.original.email;
      const joined = row.original.createdAt;
      return (
        <div className="text-md flex min-w-[150px] flex-col gap-2 whitespace-normal">
          <span className="font-bold">{name}</span>
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
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.promotionType;
      return (
        <div className="text-md flex min-w-[100px] flex-col gap-2 whitespace-normal">
          {renderPromotionBadge(type)}
        </div>
      );
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const type = row.original.session;
      const startDate = row.original.startDate;
      const endDate = row.original.endDate;
      return (
        <div className="text-md flex min-w-[200px] flex-col gap-2 whitespace-normal">
          {renderSessionBadge(type)}
          <span className="font-medium">
            {startDate.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}{' '}
            -{' '}
            {endDate.toLocaleDateString(undefined, {
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
    id: 'actions',
    header: '',
    cell: ({ row }) => <RowActions landlord={row.original} />
  }
];

function RowActions({ landlord }: { landlord: Promotion }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={'secondary'}
          className="gap-1 bg-red-100 font-medium text-red-600 hover:bg-red-200">
          <Ban className="mr-1 size-4" />
          End
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>End Promotion</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to end this promotion for <strong>{landlord.landlordName}?</strong>
        </AlertDialogDescription>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant={'destructive'}>End</Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const aggregatorBreakdown: ShortPulseCardProps[] = [
  {
    label: 'Total',
    value: '100',
    icon: Hash,
    color: 'blue'
  },
  {
    label: 'Featured',
    value: '120',
    icon: Star,
    color: 'orange'
  },
  {
    label: 'Trending',
    value: '100',
    icon: Flame,
    color: 'red'
  },
  {
    label: 'Location Spotlight',
    value: '100',
    icon: MapPin,
    color: 'green'
  }
];

export default function page() {
  const [isLoading] = React.useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined
  });

  const filteredData = filter
    ? mockPromotions.filter((item) => item.promotionType === filter)
    : mockPromotions;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-2 p-4 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">Live Overview</h1>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {aggregatorBreakdown.map((card, index) => (
            <ShortPulseCard key={index} {...card} />
          ))}
        </div>
      </div>
      <div className="box-border flex w-full flex-col gap-2 overflow-hidden p-4 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">All Promotions</h1>
        <DataTable
          columns={columns}
          data={filteredData}
          searchPlaceholder="Search by name, phone, city or any..."
          isLoading={isLoading}
          filters={{
            value: filter,
            options: [
              { label: 'Featured', value: 'featured', icon: Star },
              { label: 'Trending', value: 'trending', icon: Flame },
              { label: 'Location Spotlight', value: 'location_spotlight', icon: MapPin },
              { label: 'Show All', value: '', icon: Eye }
            ],

            onChange: (val) => setFilter(val as string)
          }}
          dateRange={range}
          setDateRange={setRange}
        />
      </div>{' '}
    </div>
  );
}
