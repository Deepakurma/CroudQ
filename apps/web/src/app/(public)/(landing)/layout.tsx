'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, ChevronsUpDown, MapPin, Search, X } from 'lucide-react';

import { Button } from '~/shared/shadcn/button';
import { Input } from '~/shared/shadcn/input';
import { Popover, PopoverContent, PopoverTrigger } from '~/shared/shadcn/popover';

import { UserDashboardFooter } from '~/components/user-dashboard/footer';
import { trpcHttp } from '~/utils/trpc';

const LandingLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [debouncedLocationSearch, setDebouncedLocationSearch] = useState('');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const isHostelDetailPage = Boolean(pathname?.match(/^\/hostels\/[^/]+$/));
  const selectedLocation = searchParams.get('location') ?? 'all';
  const { data: filteredLocations = [] } = useQuery(
    trpcHttp.publicProperty.locations.queryOptions({
      q: debouncedLocationSearch || undefined
    })
  );

  const updateSearch = (query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmedQuery = query.trim();

    if ((searchParams.get('search') ?? '') === trimmedQuery) {
      return;
    }

    if (trimmedQuery) {
      params.set('search', trimmedQuery);
    } else {
      params.delete('search');
    }
    router.replace(`/?${params.toString()}`);
  };

  useEffect(() => {
    setSearchInput(searchParams.get('search') ?? '');
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocationSearch(locationSearch.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [locationSearch]);

  const updateLocation = (location: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (location && location !== 'all') {
      params.set('location', location);
    } else {
      params.delete('location');
    }
    router.replace(`/?${params.toString()}`);
  };

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="bg-card sticky top-0 z-20 border-b p-4 backdrop-blur-md transition-all duration-300 sm:p-5">
        <div className="mx-auto flex w-full max-w-7xl flex-row items-center justify-between gap-3">
          {isHostelDetailPage && (
            <>
              <Link
                href="/"
                className="hover:bg-accent text-md inline-flex items-center gap-2 rounded-xl px-2 py-1.5 font-medium md:hidden">
                <ArrowLeft className="size-5" />
                Back Home
              </Link>
            </>
          )}

          <Link
            href="/"
            className={`flex items-center gap-1 transition-opacity hover:opacity-90 ${isHostelDetailPage ? 'hidden md:flex' : ''}`}>
            <div className="relative ml-[-5px] flex size-10 items-center justify-center overflow-hidden rounded-xl transition-all hover:opacity-90 sm:size-12">
              <Image src="/assets/Logo.png" alt="Bunkezy Logo" fill className="object-cover" />
            </div>
            <div>
              <p className="text-foreground text-md font-bold tracking-tight sm:text-lg">Bunkezy</p>
              <p className="text-muted-foreground text-[8px] font-medium tracking-wider whitespace-nowrap uppercase sm:text-[11px]">
                Living Made Easy
              </p>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="relative hidden w-full max-w-[600px] md:block">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search by hostel, locality, or address..."
              className="bg-accent border-input focus:bg-background focus:ring-primary/10 h-12 rounded-2xl pl-10 shadow-xs transition-all focus:ring-4"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <div className={`flex items-center gap-3 ${isHostelDetailPage ? 'hidden md:flex' : ''}`}>
            {/* Mobile Search Icon */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="hover:bg-accent rounded-lg p-2 transition-colors md:hidden"
              aria-label="Toggle search">
              {isSearchOpen ? (
                <X className="text-foreground size-5" />
              ) : (
                <Search className="text-foreground size-5" />
              )}
            </button>

            <Popover open={isLocationOpen} onOpenChange={setIsLocationOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isLocationOpen}
                  className="bg-accent w-[150px] justify-between rounded-2xl border-none sm:w-[170px]">
                  <span className="flex items-center gap-2 truncate">
                    <MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
                    <span className="truncate font-medium">
                      {selectedLocation === 'all' ? 'All locations' : selectedLocation}
                    </span>
                  </span>
                  <ChevronsUpDown className="text-muted-foreground h-4 w-4 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] rounded-2xl p-2" align="end">
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                      placeholder="Search location..."
                      value={locationSearch}
                      onChange={(event) => setLocationSearch(event.target.value)}
                      className="h-9 rounded-xl pl-9"
                    />
                  </div>

                  <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => {
                        updateLocation('all');
                        setIsLocationOpen(false);
                        setLocationSearch('');
                      }}
                      className="hover:bg-accent flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm">
                      <span>All locations</span>
                      <Check
                        className={`size-4 ${selectedLocation === 'all' ? 'opacity-100' : 'opacity-0'}`}
                      />
                    </button>

                    {filteredLocations.map((location) => (
                      <button
                        type="button"
                        key={location}
                        onClick={() => {
                          updateLocation(location);
                          setIsLocationOpen(false);
                          setLocationSearch('');
                        }}
                        className="hover:bg-accent flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm">
                        <span>{location}</span>
                        <Check
                          className={`size-4 ${selectedLocation === location ? 'opacity-100' : 'opacity-0'}`}
                        />
                      </button>
                    ))}

                    {filteredLocations.length === 0 && (
                      <p className="text-muted-foreground px-2.5 py-2 text-sm">
                        No locations found.
                      </p>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      {/* Mobile Search Input */}
      {isSearchOpen && !isHostelDetailPage && (
        <div className="bg-card animate-in fade-in slide-in-from-top-2 border-b p-4 duration-200 md:hidden">
          <div className="mx-auto w-full max-w-7xl">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search by hostel, locality, or address..."
                className="bg-accent border-input focus:bg-background focus:ring-primary/10 h-12 rounded-2xl pl-10 shadow-xs transition-all focus:ring-4"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">{children}</main>
      <div className={isHostelDetailPage ? 'hidden md:block' : ''}>
        <UserDashboardFooter />
      </div>
    </div>
  );
};

const LandingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LandingLayoutContent>{children}</LandingLayoutContent>
    </Suspense>
  );
};

export default LandingLayout;
