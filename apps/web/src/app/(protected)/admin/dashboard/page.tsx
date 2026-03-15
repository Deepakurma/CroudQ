'use client';

import { useEffect, useMemo, useState } from 'react';

import { Building2, ClipboardList, Clock, Users2 } from 'lucide-react';

import { LandlordAnalytics } from '~/components/admin-dashboard/landlord-analytics';
import { LandlordIntelligence } from '~/components/admin-dashboard/landlord-intelligence';
import AdminQuickActions from '~/components/admin-dashboard/quick-actions';
import { Analytics } from '~/components/admin-dashboard/users-analytics';
import PulseCard from '~/components/pulsecard';
import { trpcClient } from '~/utils/trpc';

import type { PulseCardProps } from '~/components/pulsecard';

export default function page() {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<{
    totalLandlords: number;
    totalLandlordAccounts: number;
    pendingRenewals: number;
    totalQueries: number;
    totalCapacity: number;
  } | null>(null);
  const [landlordAnalytics, setLandlordAnalytics] = useState<{
    today: { previous: number; current: number };
    week: { previous: number; current: number };
    month: { previous: number; current: number };
  } | null>(null);
  const [cityDistribution, setCityDistribution] = useState<
    Array<{
      name: string;
      landlords: number;
      occupancy: string;
      capacity: number;
      revenue: string;
    }>
  >([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const summaryResult = await trpcClient.admin.getDashboardSummaryCards
          .query()
          .catch(() => null);
        const analyticsResult = await trpcClient.admin.getDashboardLandlordAnalytics
          .query()
          .catch(() => null);
        const cityResult = await trpcClient.admin.getDashboardCityDistribution
          .query()
          .catch(() => []);

        const hasAnySplitSuccess =
          summaryResult !== null || analyticsResult !== null || cityResult.length > 0;

        if (hasAnySplitSuccess) {
          setSummary(summaryResult);
          setLandlordAnalytics(analyticsResult);
          setCityDistribution(cityResult);
        }
      } catch {
        setSummary(null);
        setLandlordAnalytics(null);
        setCityDistribution([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDashboard();
  }, []);

  const pulseData: PulseCardProps[] = useMemo(
    () => [
      {
        label: 'Total Properties',
        value: summary?.totalLandlords ?? 0,
        sub: 'No of properties onboarded',
        color: 'green',
        icon: Building2
      },
      {
        label: 'Total Landlord Accounts',
        value: summary?.totalLandlordAccounts ?? 0,
        sub: 'Registered landlord accounts',
        color: 'blue',
        icon: Users2
      },
      {
        label: 'Pending Renewals',
        value: summary?.pendingRenewals ?? 0,
        sub: 'Requires Action',
        button: 'View All',
        buttonLink: '/admin/landlords',
        color: 'red',
        icon: Clock
      },
      {
        label: 'Queries',
        value: summary?.totalQueries ?? 0,
        sub: 'Landlord queries received',
        color: 'orange',
        icon: ClipboardList
      }
    ],
    [summary]
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-2 p-4 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">Overview</h1>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {pulseData.map((card, index) => (
            <PulseCard key={index} {...card} isLoading={isLoading} />
          ))}
        </div>
      </div>

      <LandlordAnalytics analytics={landlordAnalytics ?? undefined} isLoading={isLoading} />
      <Analytics />

      <LandlordIntelligence data={cityDistribution} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-0 px-4 sm:gap-4 lg:gap-6">
        <AdminQuickActions />
      </div>
    </div>
  );
}
