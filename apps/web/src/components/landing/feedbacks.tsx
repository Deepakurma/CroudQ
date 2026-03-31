'use client';

import { useEffect, useMemo, useState } from 'react';

import { MoreHorizontal, Trash2 } from 'lucide-react';
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

type FeedbackRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
};

function FeedbackActions({ id, onDelete }: { id: string; onDelete: (id: string) => void }) {
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
          onSelect={(event) => {
            event.preventDefault();
            onDelete(id);
          }}>
          <Trash2 className="mr-1 size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<FeedbackRow>[] = [
  {
    id: 'sno',
    header: () => <div className="w-5 text-center">S.No</div>,
    cell: ({ row }) => <div className="text-center">{row.index + 1}</div>
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'message',
    header: 'Message',
    cell: ({ row }) => (
      <div className="min-w-[300px] whitespace-pre-wrap">{row.original.message}</div>
    )
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <span>
        {row.original.createdAt.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}
      </span>
    )
  },
  {
    id: 'actions',
    header: '',
    cell: () => null
  }
];

export default function Feedbacks() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const fetchFeedbacks = async () => {
    if (!isLoading) setIsFetching(true);
    if (isLoading) setIsLoading(true);

    try {
      const data = await trpcClient.adminFeedback.list.query({
        limit: pageSize,
        offset: pageIndex * pageSize
      });
      setRows(
        data.items.map((item) => ({
          id: item.id,
          name: item.name?.trim() || 'Anonymous',
          email: item.email,
          message: item.message,
          createdAt: new Date(item.createdAt)
        }))
      );
      setTotalCount(data.total);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load feedbacks.';
      toast.error(message);
      setRows([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    void fetchFeedbacks();
  }, [pageIndex, pageSize]);

  const handleDelete = async (id: string) => {
    try {
      await trpcClient.adminFeedback.delete.mutate({ id });
      toast.success('Feedback deleted');

      if (rows.length === 1 && pageIndex > 0) {
        setPageIndex((prev) => prev - 1);
      } else {
        await fetchFeedbacks();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete feedback.';
      toast.error(message);
    }
  };

  const hasRows = useMemo(() => rows.length > 0, [rows]);
  const columnsWithActions = useMemo<ColumnDef<FeedbackRow>[]>(() => {
    return columns.map((column) => {
      if (column.id !== 'actions') return column;
      return {
        ...column,
        cell: ({ row }) => <FeedbackActions id={row.original.id} onDelete={handleDelete} />
      };
    });
  }, [handleDelete]);

  return (
    <div className="mx-auto mt-6 flex w-full max-w-7xl flex-1 flex-col overflow-hidden">
      <div className="box-border flex w-full flex-col gap-3 overflow-hidden">
        <h1 className="text-sm font-semibold tracking-widest uppercase">All Feedbacks</h1>
        <DataTable
          columns={columnsWithActions}
          data={hasRows ? rows : []}
          searchPlaceholder="Search feedback..."
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
        />
      </div>
    </div>
  );
}
