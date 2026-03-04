'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, MapPin } from 'lucide-react';

import { Button } from '~/shared/shadcn/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/shared/shadcn/card';

import { Filters } from '~/components/user-dashboard/filters';
import { HostelCard } from '~/components/user-dashboard/hostel-card';
import { useFilters } from '~/components/user-dashboard/usefilters';
import { trpcClient } from '~/utils/trpc';

const getPriceRange = (pricingFilter: 'all' | 'under-5000' | '5000-7000' | 'above-7000') => {
  if (pricingFilter === 'under-5000') return { minPrice: 0, maxPrice: 4999 };
  if (pricingFilter === '5000-7000') return { minPrice: 5000, maxPrice: 7000 };
  if (pricingFilter === 'above-7000') return { minPrice: 7001, maxPrice: undefined };
  return { minPrice: undefined, maxPrice: undefined };
};

function LandingPageContent() {
  const searchParams = useSearchParams();
  const searchValue = searchParams.get('search') ?? '';
  const selectedLocation = searchParams.get('location') ?? 'all';
  const {
    pricingFilter,
    setPricingFilter,
    sharingFilter,
    setSharingFilter,
    propertyTypeFilter,
    setPropertyTypeFilter
  } = useFilters();

  const { minPrice, maxPrice } = getPriceRange(pricingFilter);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [supportsIntersectionObserver, setSupportsIntersectionObserver] = useState(false);
  const queryInput = useMemo(
    () => ({
      search: searchValue.trim() || undefined,
      location: selectedLocation === 'all' ? undefined : selectedLocation,
      sharingType: sharingFilter === 'all' ? undefined : sharingFilter,
      propertyType: propertyTypeFilter === 'all' ? undefined : propertyTypeFilter,
      minPrice,
      maxPrice,
      limit: 24
    }),
    [maxPrice, minPrice, propertyTypeFilter, searchValue, selectedLocation, sharingFilter]
  );

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['publicProperty.list', queryInput],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      trpcClient.publicProperty.list.query({
        ...queryInput,
        cursor: pageParam
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
  });

  const hostels = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  useEffect(() => {
    setSupportsIntersectionObserver(typeof IntersectionObserver !== 'undefined');
  }, []);

  useEffect(() => {
    if (!supportsIntersectionObserver) return;
    if (!hasNextPage) return;
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, supportsIntersectionObserver]);

  const hasAppliedFilters =
    pricingFilter !== 'all' || sharingFilter !== 'all' || propertyTypeFilter !== 'all';

  const clearFilters = () => {
    setPricingFilter('all');
    setSharingFilter('all');
    setPropertyTypeFilter('all');
  };

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-6 sm:gap-8">
      <Filters
        pricingFilter={pricingFilter}
        onPricingFilterChange={setPricingFilter}
        sharingFilter={sharingFilter}
        onSharingFilterChange={setSharingFilter}
        propertyTypeFilter={propertyTypeFilter}
        onPropertyTypeFilterChange={setPropertyTypeFilter}
        hasAppliedFilters={hasAppliedFilters}
        onClearFilters={clearFilters}
      />

      {selectedLocation !== 'all' && (
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 text-xl font-medium sm:text-2xl">
          Hostels in {selectedLocation}
        </div>
      )}

      {isLoading ? (
        <Card className="flex w-full flex-1 flex-col justify-center border-dashed text-center">
          <CardHeader className="space-y-3">
            <Loader2 className="text-muted-foreground mx-auto size-6 animate-spin" />
            <CardTitle className="text-2xl">Loading hostels...</CardTitle>
          </CardHeader>
        </Card>
      ) : hostels.length === 0 ? (
        <Card className="flex w-full flex-1 flex-col justify-center border-dashed text-center">
          <CardHeader className="space-y-4">
            <div className="bg-muted text-muted-foreground mx-auto flex size-16 items-center justify-center rounded-3xl">
              <MapPin className="size-8" />
            </div>
            <CardTitle className="text-2xl">No results found</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground mx-auto max-w-md text-base">
            We couldn't find any hostels matching your search criteria. Try adjusting your filters
            or searching in a different area.
          </CardContent>
          <CardFooter className="justify-center">
            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
              className="rounded-2xl px-8">
              Clear all filters
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hostels.map((hostel) => (
              <HostelCard key={hostel.id} hostel={hostel} />
            ))}
          </section>
          {supportsIntersectionObserver ? <div ref={sentinelRef} className="h-8 w-full" /> : null}
          {isFetchingNextPage ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading more hostels...
            </div>
          ) : null}
          {!supportsIntersectionObserver && hasNextPage ? (
            <div className="flex justify-center py-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl px-8"
                onClick={() => void fetchNextPage()}>
                Load more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LandingPageContent />
    </Suspense>
  );
}
