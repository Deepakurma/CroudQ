'use client';

import React from 'react';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { type DateRange } from 'react-day-picker';

import { cn } from '~/lib/utils';
import { Button } from '~/shared/shadcn/button';
import { Calendar } from '~/shared/shadcn/calendar';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/shared/shadcn/dropdown-menu';
import { Input } from '~/shared/shadcn/input';
import { Popover, PopoverContent, PopoverTrigger } from '~/shared/shadcn/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/shared/shadcn/select';
import { Skeleton } from '~/shared/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/shared/shadcn/table';

import type { ColumnDef, SortingState } from '@tanstack/react-table';

type TableFilterOption = {
  label: string;
  value: string | number;
  icon?: React.ElementType;
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  isLoading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  serverSideSearch?: boolean;

  isActiveToggle?: boolean;
  setIsActiveToggle?: (val: boolean) => void;

  dateRange?: DateRange;
  setDateRange?: (range: DateRange | undefined) => void;

  filters?: {
    value: string | number | null;
    options: TableFilterOption[];
    onChange: (value: string | number) => void;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  isLoading = false,
  searchValue,
  onSearchChange,
  serverSideSearch = false,
  dateRange,
  setDateRange,
  filters
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter
  });

  const resultsCount = serverSideSearch ? data.length : table.getFilteredRowModel().rows.length;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium sm:text-[15px]">
        <span className="text-muted-foreground text-sm tracking-wider">Results</span>({resultsCount}
        )
      </p>

      {setDateRange !== undefined && (
        <div className={cn(filters !== undefined ? 'lg:hidden' : 'hidden')}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`bg-card max-w-[250px] justify-between rounded-md text-left font-normal ${
                  !dateRange?.from && 'text-muted-foreground'
                }`}>
                <CalendarIcon className="mr-1 h-4 w-4" />
                {dateRange?.from && dateRange?.to ? (
                  <>
                    {format(dateRange.from, 'MMM dd, yyyy')} -{' '}
                    {format(dateRange.to, 'MMM dd, yyyy')}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange?.(range);
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Search Input */}
      <div className="flex flex-col-reverse justify-between gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-lg">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={searchPlaceholder}
            value={onSearchChange ? (searchValue ?? '') : globalFilter}
            onChange={(event) => {
              if (onSearchChange) {
                onSearchChange(event.target.value);
                return;
              }
              setGlobalFilter(event.target.value);
            }}
            className="bg-card pl-9"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center gap-5">
          {/* Date filter */}
          {setDateRange !== undefined && (
            <div className={cn(filters !== undefined ? 'hidden lg:block' : 'block')}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`bg-card max-w-[250px] justify-between rounded-md text-left font-normal ${
                      !dateRange?.from && 'text-muted-foreground'
                    }`}>
                    <CalendarIcon className="mr-1 h-4 w-4" />
                    {dateRange?.from && dateRange?.to ? (
                      <>
                        {format(dateRange.from, 'MMM dd, yyyy')} -{' '}
                        {format(dateRange.to, 'MMM dd, yyyy')}
                      </>
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange?.(range);
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {filters && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-card rounded-md border" variant="secondary">
                  {filters.value ? (
                    <>
                      {(() => {
                        const Icon = filters.options.find((o) => o.value === filters.value)?.icon;

                        return Icon ? <Icon className="h-4 w-4" /> : null;
                      })()}
                      <span>{filters.options.find((o) => o.value === filters.value)?.label}</span>
                    </>
                  ) : (
                    'Filters'
                  )}

                  <ChevronDown className="size-5 shrink-0" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                {filters.options.map((item) => (
                  <DropdownMenuItem key={item.value} onClick={() => filters.onChange(item.value)}>
                    {item.icon ? <item.icon className="h-4 w-4" /> : null}
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-card rounded-md border" variant="secondary">
                Columns <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                    {column.id === 'landlordDetails'
                      ? 'Landlord Details'
                      : column.id === 'sno'
                        ? 'S.No'
                        : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="border-border bg-card overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-accent/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-muted-foreground px-6 py-4 text-[12px] font-bold tracking-wider uppercase sm:text-[13px]">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="border-border/70">
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex} className="p-4">
                      <Skeleton className="h-15 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group border-border/70 transition-colors last:border-none">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col items-center justify-between gap-2">
        <div className="text-muted-foreground text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}>
            <SelectTrigger className="bg-card w-[100px] cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              className="bg-card"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || isLoading}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              className="bg-card"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || isLoading}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
