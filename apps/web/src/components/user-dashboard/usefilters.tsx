'use client';

import { useState } from 'react';

export type PricingFilter = 'all' | 'under-5000' | '5000-7000' | 'above-7000';
export type SharingFilter =
  | 'all'
  | 'single'
  | '2-sharing'
  | '3-sharing'
  | '4-sharing'
  | '5-sharing'
  | '6-sharing';
export type PropertyTypeFilter =
  | 'all'
  | 'boys-property'
  | 'girls-property'
  | 'pg'
  | 'coliving'
  | 'apartments';

export function useFilters() {
  const [pricingFilter, setPricingFilter] = useState<PricingFilter>('all');
  const [sharingFilter, setSharingFilter] = useState<SharingFilter>('all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<PropertyTypeFilter>('all');

  return {
    pricingFilter,
    setPricingFilter,
    sharingFilter,
    setSharingFilter,
    propertyTypeFilter,
    setPropertyTypeFilter
  };
}
