'use client';

import { useEffect, useMemo, useState } from 'react';

import { ClipboardList, History, Percent, UsersRound } from 'lucide-react';
import { toast } from 'sonner';

import { Analytics } from '~/components/admin-dashboard/users-analytics';
import Feedbacks from '~/components/landing/feedbacks';
import PulseCard from '~/components/pulsecard';
import { trpcClient } from '~/utils/trpc';

import type { PulseCardProps } from '~/components/pulsecard';

export default function page() {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<{
    totalCreators: number;
    connectedCreators: number;
    conversionRate: number;
    totalFeedbacks: number;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchOverview = async () => {
      setIsLoading(true);
      try {
        const data = await trpcClient.adminDashboard.overview.query();
        if (mounted) setSummary(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load dashboard data.';
        toast.error(message);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchOverview();

    return () => {
      mounted = false;
    };
  }, []);

  const pulseData: PulseCardProps[] = useMemo(
    () => [
      {
        label: 'Total Creators',
        value: summary?.totalCreators ?? 0,
        sub: 'No of active creators',
        color: 'green',
        icon: UsersRound
      },
      {
        label: 'Conversion Rate',
        value: `${Math.round(summary?.conversionRate ?? 0)}%`,
        sub: 'Active connected creators',
        color: 'blue',
        icon: Percent
      },
      {
        label: 'Pending Renewals',
        value: 0,
        sub: 'Pending creator renewals',
        color: 'red',
        icon: History
      },
      {
        label: 'Feedbacks',
        value: summary?.totalFeedbacks ?? 0,
        sub: 'Creator feedback submissions',
        color: 'orange',
        icon: ClipboardList
      }
    ],
    [summary]
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-2 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">Overview</h1>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {pulseData.map((card, index) => (
            <PulseCard key={index} {...card} isLoading={isLoading} />
          ))}
        </div>
      </div>
      <Analytics />
      <Feedbacks />
    </div>
  );
}
