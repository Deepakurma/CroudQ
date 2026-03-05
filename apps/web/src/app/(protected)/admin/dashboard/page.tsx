'use client';

import { useEffect, useMemo, useState } from 'react';

import { Building2, ClipboardList, Clock } from 'lucide-react';

import { LandlordAnalytics } from '~/components/admin-dashboard/landlord-analytics';
import { LandlordIntelligence } from '~/components/admin-dashboard/landlord-intelligence';
import AdminQuickActions from '~/components/admin-dashboard/quick-actions';
import { Analytics } from '~/components/admin-dashboard/users-analytics';
import PulseCard from '~/components/pulsecard';
import { trpcClient } from '~/utils/trpc';

import type { PulseCardProps } from '~/components/pulsecard';

export default function page() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboard, setDashboard] = useState<{
    summary: {
      totalLandlords: number;
      pendingRenewals: number;
      totalQueries: number;
      totalCapacity: number;
    };
    landlordAnalytics: {
      today: { previous: number; current: number };
      week: { previous: number; current: number };
      month: { previous: number; current: number };
    };
    cityDistribution: Array<{
      name: string;
      landlords: number;
      occupancy: string;
      capacity: number;
      revenue: string;
    }>;
  } | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const payload = await trpcClient.admin.getDashboardSummary.query();
        setDashboard(payload);
      } catch {
        setDashboard(null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDashboard();
  }, []);

  const pulseData: PulseCardProps[] = useMemo(
    () => [
      {
        label: 'Total Landlords',
        value: dashboard?.summary.totalLandlords ?? 0,
        sub: 'No of Landlords onboarded',
        button: 'Add+',
        buttonLink: '#',
        color: 'green',
        icon: Building2
      },
      {
        label: 'Pending Renewals',
        value: dashboard?.summary.pendingRenewals ?? 0,
        sub: 'Requires Action',
        button: 'View All',
        buttonLink: '/admin/landlords',
        color: 'red',
        icon: Clock
      },
      {
        label: 'Queries',
        value: dashboard?.summary.totalQueries ?? 0,
        sub: 'Landlord queries received',
        color: 'orange',
        icon: ClipboardList
      }
    ],
    [dashboard]
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-2 p-4 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">Overview</h1>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
          {pulseData.map((card, index) => (
            <PulseCard key={index} {...card} isLoading={isLoading} />
          ))}
        </div>
      </div>

      <LandlordAnalytics analytics={dashboard?.landlordAnalytics} isLoading={isLoading} />
      <Analytics />

      <LandlordIntelligence data={dashboard?.cityDistribution} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-0 px-4 sm:gap-4 lg:gap-6">
        <AdminQuickActions />
      </div>
    </div>
  );
}
