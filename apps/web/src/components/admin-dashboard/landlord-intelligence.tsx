'use client';

import { OverviewTable } from '../overview-table';

import type { ColumnDef } from '@tanstack/react-table';

export type CityData = {
  name: string;
  landlords: number;
  occupancy: string;
  revenue: string;
  capacity: string | number;
};

const data: CityData[] = [];

export const columns: ColumnDef<CityData>[] = [
  {
    accessorKey: 'name',
    header: 'City Hub',
    cell: ({ row }) => {
      const name = row.getValue('name') as string;
      return (
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-black sm:text-[12px]">
            {name.substring(0, 2).toUpperCase()}
          </div>
          <span className="font-semibold sm:font-bold">{name}</span>
        </div>
      );
    }
  },
  {
    accessorKey: 'landlords',
    header: 'Landlords',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-semibold sm:font-bold">
          {row.getValue('landlords')}{' '}
          <span className="text-muted-foreground/70 ml-0.5 font-medium">landlords</span>
        </span>
      </div>
    )
  },
  {
    accessorKey: 'occupancy',
    header: 'Avg Occupancy',
    cell: ({ row }) => {
      const occupancy = row.getValue('occupancy') as string;
      return (
        <div className="w-24 space-y-1.5">
          <div className="flex justify-between">
            <span className="font-semibold sm:font-bold">{occupancy}</span>
          </div>
          <div className="bg-muted-foreground/50 h-1 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: occupancy }}
            />
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: 'Capacity',
    header: 'Capacity',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-semibold sm:font-bold">
          {row.original.capacity}{' '}
          <span className="text-muted-foreground/70 ml-0.5 font-medium">beds</span>
        </span>
      </div>
    )
  }
];

// --- Main Component ---
interface LandlordIntelligenceProps {
  data?: CityData[];
  isLoading?: boolean;
}

export function LandlordIntelligence({ data: inputData, isLoading }: LandlordIntelligenceProps) {
  return (
    <div className="flex flex-col gap-2 p-4 sm:gap-3">
      <h1 className="text-sm font-semibold tracking-widest uppercase">
        City wise landlord distribution
      </h1>

      <OverviewTable data={inputData || data} columns={columns} isLoading={isLoading} />
    </div>
  );
}
