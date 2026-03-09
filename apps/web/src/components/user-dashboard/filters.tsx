'use client';

import { SlidersHorizontal, X } from 'lucide-react';

import { Button } from '~/shared/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/shared/shadcn/select';

import type {
  PricingFilter,
  PropertyTypeFilter,
  SharingFilter
} from '~/components/user-dashboard/usefilters';

type FiltersProps = {
  pricingFilter: PricingFilter;
  onPricingFilterChange: (value: PricingFilter) => void;
  sharingFilter: SharingFilter;
  onSharingFilterChange: (value: SharingFilter) => void;
  propertyTypeFilter: PropertyTypeFilter;
  onPropertyTypeFilterChange: (value: PropertyTypeFilter) => void;
  hasAppliedFilters: boolean;
  onClearFilters: () => void;
};

const pricingOptions: Array<{ label: string; value: PricingFilter }> = [
  { label: 'Pricing', value: 'all' },
  { label: 'Under ₹5000', value: 'under-5000' },
  { label: '₹5000 - ₹7000', value: '5000-7000' },
  { label: 'Above ₹7000', value: 'above-7000' }
];

const sharingOptions: Array<{ label: string; value: SharingFilter }> = [
  { label: 'Sharing Types', value: 'all' },
  { label: 'Single', value: 'single' },
  { label: '2-Sharing', value: '2-sharing' },
  { label: '3-Sharing', value: '3-sharing' },
  { label: '4-Sharing', value: '4-sharing' },
  { label: '5-Sharing', value: '5-sharing' },
  { label: '6-Sharing', value: '6-sharing' }
];

const propertyTypeOptions: Array<{ label: string; value: PropertyTypeFilter }> = [
  { label: 'Property Types', value: 'all' },
  { label: 'Boys Hostel', value: 'boys-hostel' },
  { label: 'Girls Hostel', value: 'girls-hostel' },
  { label: 'PG', value: 'pg' },
  { label: 'Coliving', value: 'coliving' }
];

export function Filters({
  pricingFilter,
  onPricingFilterChange,
  sharingFilter,
  onSharingFilterChange,
  propertyTypeFilter,
  onPropertyTypeFilterChange,
  hasAppliedFilters,
  onClearFilters
}: FiltersProps) {
  return (
    <section className="bg-card flex flex-col gap-y-3 rounded-2xl border p-3 shadow-sm sm:gap-4 sm:rounded-3xl sm:p-4">
      <div className="flex w-full items-center justify-between gap-5 sm:justify-start sm:gap-10">
        <div className="flex items-center gap-2 text-[15px] font-medium sm:text-lg">
          <SlidersHorizontal className="size-4 sm:size-5" />
          <span>Filter Properties</span>
        </div>
        {hasAppliedFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground bg-destructive/10 h-auto w-fit rounded-lg px-2 py-1">
            <X className="text-destructive size-4" />
            <span className="text-destructive text-xs sm:text-sm">Clear</span>
          </Button>
        )}
      </div>

      <div className="grid w-full grid-cols-1 gap-y-3 sm:grid-cols-3 sm:gap-3">
        <Select
          value={pricingFilter}
          onValueChange={(value) => onPricingFilterChange(value as PricingFilter)}>
          <SelectTrigger className="w-full rounded-lg sm:rounded-xl">
            <SelectValue placeholder="Select pricing range" />
          </SelectTrigger>
          <SelectContent>
            {pricingOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="col-span-2 grid w-full grid-cols-2 gap-3">
          <Select
            value={sharingFilter}
            onValueChange={(value) => onSharingFilterChange(value as SharingFilter)}>
            <SelectTrigger className="w-full rounded-lg sm:rounded-xl">
              <SelectValue placeholder="Select sharing type" />
            </SelectTrigger>
            <SelectContent>
              {sharingOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={propertyTypeFilter}
            onValueChange={(value) => onPropertyTypeFilterChange(value as PropertyTypeFilter)}>
            <SelectTrigger className="w-full rounded-lg sm:rounded-xl">
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              {propertyTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
