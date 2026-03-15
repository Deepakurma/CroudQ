'use client';

import { Skeleton } from '~/shared/shadcn/skeleton';

import { AnalyticsCard } from '../analytics/analytics-card';

export const description = 'A radial chart with stacked sections';

const visitorStats = [
  {
    key: 'today',
    title: 'New Today',
    growth: '',
    description: 'Past 24 hours',
    note: 'from past 24 hours'
  },
  {
    key: 'week',
    title: 'New This week',
    growth: '',
    description: 'Last 7 days',
    note: 'vs last week'
  },
  {
    key: 'month',
    title: 'New This Month',
    growth: '',
    description: 'Last 30 days',
    note: 'vs previous month'
  }
];

const EMPTY_ANALYTICS = {
  today: { previous: 0, current: 0 },
  week: { previous: 0, current: 0 },
  month: { previous: 0, current: 0 }
};

function calculateGrowth(previous: number, current: number) {
  if (previous === 0) return '0%';
  const growth = ((current - previous) / previous) * 100;
  if (growth <= 0) return '0%';
  return `${growth.toFixed(1)}%`;
}

interface LandlordAnalyticsProps {
  isLoading?: boolean;
  analytics?: {
    today: { previous: number; current: number };
    week: { previous: number; current: number };
    month: { previous: number; current: number };
  };
}

export function LandlordAnalytics({ analytics, isLoading }: LandlordAnalyticsProps) {
  return (
    <div className="flex flex-col gap-2 p-4 sm:gap-3">
      <h1 className="text-sm font-semibold tracking-widest uppercase">Properties Analytics</h1>
      <div className="no-scrollbar flex w-full gap-3 overflow-x-auto sm:grid sm:grid-cols-3 sm:gap-4 lg:gap-6">
        {isLoading
          ? visitorStats.map((stat) => (
              <div key={stat.key} className="bg-card space-y-4 rounded-xl border p-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))
          : visitorStats.map((stat) => {
              const data = (analytics || EMPTY_ANALYTICS)[stat.key as keyof typeof EMPTY_ANALYTICS];
              return (
                <AnalyticsCard
                  label="Properties"
                  key={stat.key}
                  stat={{
                    ...stat,
                    growth: calculateGrowth(data.previous, data.current)
                  }}
                  data={data}
                  colors={{
                    current: 'var(--chart-3)',
                    previous: 'var(--chart-4)'
                  }}
                />
              );
            })}
      </div>
    </div>
  );
}
