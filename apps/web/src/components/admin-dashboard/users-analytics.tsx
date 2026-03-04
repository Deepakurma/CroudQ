'use client';

import { AnalyticsCard } from '../analytics/analytics-card';

export const description = 'A radial chart with stacked sections';

const visitorStats = [
  {
    key: 'today',
    title: 'Daily Visitors',
    growth: '',
    description: 'Past 24 hours',
    note: 'from past 24 hours'
  },
  {
    key: 'week',
    title: 'Weekly Visitors',
    growth: '',
    description: 'Last 7 days',
    note: 'vs last week'
  },
  {
    key: 'month',
    title: 'Monthly Visitors',
    growth: '',
    description: 'Last 30 days',
    note: 'vs previous month'
  }
];

// Dummy data until Google Analytics integration is wired.
const DUMMY_ANALYTICS = {
  today: { previous: 8500, current: 12842 },
  week: { previous: 240000, current: 284500 },
  month: { previous: 1100000, current: 1200000 }
};

export function Analytics() {
  return (
    <div className="flex flex-col gap-2 p-4 sm:gap-3">
      <h1 className="text-sm font-semibold tracking-widest uppercase">Traffic Overview</h1>
      <div className="no-scrollbar flex w-full gap-3 overflow-x-auto sm:grid sm:grid-cols-3 sm:gap-4 lg:gap-6">
        {' '}
        {visitorStats.map((stat) => (
          //   <TrafficCard
          //     key={idx}
          //     stat={{
          //       ...stat,
          //       growth: calculateGrowth(
          //         analytics[stat.key as keyof typeof analytics].previous,
          //         analytics[stat.key as keyof typeof analytics].current
          //       )
          //     }}
          //     data={analytics[stat.key as keyof typeof analytics]}
          //   />
          <AnalyticsCard
            key={stat.key}
            stat={stat}
            data={DUMMY_ANALYTICS[stat.key as keyof typeof DUMMY_ANALYTICS]}
            colors={{
              current: 'var(--chart-1)',
              previous: 'var(--chart-2)'
            }}
          />
        ))}
      </div>
    </div>
  );
}
