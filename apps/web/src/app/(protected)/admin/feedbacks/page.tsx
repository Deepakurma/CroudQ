'use client';

import React, { useEffect, useState } from 'react';

import clsx from 'clsx';
import { Eye, MoreHorizontal, Star, Trash2 } from 'lucide-react';
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

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={clsx(
            'size-4',
            i < value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
          )}
        />
      ))}
    </div>
  );
}

export interface Query {
  id: string;
  rating: number;
  description: string;
  createdAt: Date;
}

type FeedbackApiItem = {
  id: string;
  rating: number | string | null;
  description: string | null;
  createdAt: string | Date;
};

const columns: ColumnDef<Query>[] = [
  {
    id: 'sno',
    header: () => <div className="w-5 text-center">S.No</div>,
    cell: ({ row }) => <div className="text-center">{row.index + 1}</div>
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ row }) => {
      const desc = row.getValue('rating') as number;
      return <StarRating value={desc} />;
    }
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      const description = row.original.description;
      return (
        <div className="text-md flex min-w-[300px] flex-col gap-2 font-medium whitespace-normal sm:text-[15px]">
          <span>{description}</span>
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

function FeedbackRowActions({ id, onDelete }: { id: string; onDelete: (id: string) => void }) {
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
  const [feedbacks, setFeedbacks] = useState<Query[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const [filter, setFilter] = useState<number | null>(null);

  useEffect(() => {
    setPageIndex(0);
  }, [searchQuery, range?.from, range?.to, filter]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      const hasLoaded = hasLoadedRef.current;
      if (!hasLoaded) setIsLoading(true);
      if (hasLoaded) setIsFetching(true);
      try {
        const payload = await trpcClient.admin.listFeedbacks.query({
          q: searchQuery.trim() || undefined,
          from: range?.from,
          to: range?.to,
          rating: filter ?? undefined,
          limit: pageSize,
          offset: pageIndex * pageSize
        });
        const items = Array.isArray(payload) ? payload : payload.items;
        const mapped = (items as FeedbackApiItem[]).map((item) => ({
          id: item.id,
          rating: Number(item.rating) || 0,
          description: item.description || '',
          createdAt: new Date(item.createdAt)
        }));
        setFeedbacks(mapped);
        setTotalCount(Array.isArray(payload) ? mapped.length : (payload.total ?? mapped.length));
      } catch {
        setFeedbacks([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
        setIsFetching(false);
        hasLoadedRef.current = true;
      }
    };

    void fetchFeedbacks();
  }, [searchQuery, range?.from, range?.to, filter, pageIndex, pageSize]);

  const handleDelete = async (id: string) => {
    try {
      await trpcClient.admin.deleteFeedback.mutate({ id });

      setFeedbacks((prev) => prev.filter((item) => item.id !== id));
      toast.success('Feedback deleted');
    } catch {
      toast.error('Could not delete feedback right now. Please try again.');
    }
  };

  const columnsWithActions = React.useMemo<ColumnDef<Query>[]>(() => {
    return columns.map((column) => {
      if (column.id !== 'actions') return column;
      return {
        ...column,
        cell: ({ row }) => <FeedbackRowActions id={row.original.id} onDelete={handleDelete} />
      };
    });
  }, [handleDelete]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="box-border flex w-full flex-col gap-2 overflow-hidden p-4 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">All Feedbacks</h1>
        <DataTable
          columns={columnsWithActions}
          data={feedbacks}
          searchPlaceholder="Search by name, phone, city or any..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          serverSideSearch={true}
          serverSidePagination={true}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
          isLoading={isLoading}
          isFetching={isFetching}
          dateRange={range}
          setDateRange={setRange}
          filters={{
            value: filter,
            options: [
              { label: '1 stars', value: 1 },
              { label: '2 stars', value: 2 },
              { label: '3 stars', value: 3 },
              { label: '4 stars', value: 4 },
              { label: '5 stars', value: 5 },
              { label: 'Show All', value: '', icon: Eye }
            ],
            onChange: (val) => setFilter(val === '' ? null : (val as number))
          }}
        />
      </div>{' '}
    </div>
  );
}
