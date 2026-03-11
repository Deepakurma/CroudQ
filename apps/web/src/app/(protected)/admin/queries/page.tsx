'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import { MoreHorizontal, Trash2 } from 'lucide-react';
import { type DateRange } from 'react-day-picker';
import { toast } from 'sonner';

import { Button } from '~/shared/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/shared/shadcn/dropdown-menu';

import { DataTable } from '~/components/datatable';
import { trpcClient } from '~/utils/trpc';

import type { ColumnDef } from '@tanstack/react-table';

export interface Query {
  id: string;
  landlordName: string;
  inchargeName: string;
  phoneNumber: string;
  dateJoined: Date;
  email?: string;
  city: string;
  address: string;
  pincode: string | number;
  state: string;
  googleUrl: string;
  query: string;
  createdAt: Date;
}

type QueryApiItem = {
  id: string;
  landlordName?: string | null;
  inchargeName?: string | null;
  phoneNumber?: string | null;
  createdAt: string | Date;
  email?: string | null;
  city?: string | null;
  address?: string | null;
  pincode?: string | number | null;
  state?: string | null;
  googleUrl?: string | null;
  query?: string | null;
};

const columns: ColumnDef<Query>[] = [
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
      const joined = row.original.dateJoined;
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
    accessorKey: 'query',
    header: 'Query',
    cell: ({ row }) => {
      const query = row.original.query;
      return (
        <div className="text-md flex min-w-[300px] flex-col gap-2 font-medium whitespace-normal sm:text-[15px]">
          <span>{query}</span>
        </div>
      );
    }
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return (
        <div className="text-md flex min-w-[100px] flex-col gap-2 font-medium whitespace-normal">
          <span>
            {' '}
            {date.toLocaleDateString(undefined, {
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
    cell: () => null
  }
];

function QueryRowActions({ id, onDelete }: { id: string; onDelete: (id: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          variant="destructive"
          onSelect={(e) => {
            e.preventDefault();
            onDelete(id);
          }}>
          <Trash2 className="mr-1 size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function page() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(false);
  const hasLoadedRef = React.useRef(false);
  const [queries, setQueries] = useState<Query[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined
  });

  useEffect(() => {
    const fetchQueries = async () => {
      const hasLoaded = hasLoadedRef.current;
      if (!hasLoaded) setIsLoading(true);
      if (hasLoaded) setIsFetching(true);
      try {
        const payload = await trpcClient.admin.listQueries.query({
          q: searchQuery.trim() || undefined
        });

        const mapped = (payload as QueryApiItem[]).map((item) => ({
          id: item.id,
          landlordName: item.landlordName || 'N/A',
          inchargeName: item.inchargeName || 'N/A',
          phoneNumber: item.phoneNumber || 'N/A',
          dateJoined: new Date(item.createdAt),
          email: item.email || undefined,
          city: item.city || 'N/A',
          address: item.address || 'N/A',
          pincode: item.pincode || 'N/A',
          state: item.state || 'N/A',
          googleUrl: item.googleUrl || '#',
          query: item.query || '',
          createdAt: new Date(item.createdAt)
        }));
        setQueries(mapped);
      } catch {
        setQueries([]);
      } finally {
        setIsLoading(false);
        setIsFetching(false);
        hasLoadedRef.current = true;
      }
    };

    void fetchQueries();
  }, [searchQuery]);

  const handleDelete = async (id: string) => {
    try {
      await trpcClient.admin.deleteQuery.mutate({ id });

      setQueries((prev) => prev.filter((item) => item.id !== id));
      toast.success('Query deleted');
    } catch {
      toast.error('Could not delete query right now. Please try again.');
    }
  };

  const columnsWithActions = React.useMemo<ColumnDef<Query>[]>(() => {
    return columns.map((column) => {
      if (column.id !== 'actions') return column;
      return {
        ...column,
        cell: ({ row }) => <QueryRowActions id={row.original.id} onDelete={handleDelete} />
      };
    });
  }, [handleDelete]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="box-border flex w-full flex-col gap-2 overflow-hidden p-4 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">All Queries</h1>
        <DataTable
          columns={columnsWithActions}
          data={queries}
          searchPlaceholder="Search by name, phone, city or any..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          serverSideSearch={true}
          isLoading={isLoading}
          isFetching={isFetching}
          dateRange={range}
          setDateRange={setRange}
        />
      </div>{' '}
    </div>
  );
}
