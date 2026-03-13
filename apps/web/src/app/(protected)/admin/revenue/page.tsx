'use client';

import { Code2, IndianRupee, Network, Target } from 'lucide-react';

import { AnalyticsBarChart } from '~/components/analytics/analytics-barchart';
import { AnalyticsCard } from '~/components/analytics/analytics-card';
import { AnalyticsLineChart } from '~/components/analytics/analytics-linechart';
import PulseCard from '~/components/pulsecard';

import type { PulseCardProps } from '~/components/pulsecard';

const pulseData: PulseCardProps[] = [
  {
    label: 'Total Revenue',
    value: 10000000,
    sub: 'total revenue till date',
    color: 'green',
    icon: IndianRupee
  },
  {
    label: 'Saas Revenue',
    value: 10000,
    sub: 'revenue incured from software service',
    color: 'blue',
    icon: Code2
  },
  {
    label: 'Aggregate Revenue',
    value: 10000,
    sub: 'revenue incured from aggregate service',
    color: 'indigo',
    icon: Network
  },
  {
    label: 'Advertisements Revenue',
    value: 10000,
    sub: 'revenue incured from advertisements',
    color: 'orange',
    icon: Target
  }
];

const revenueStats = [
  {
    key: 'today',
    title: 'Today',
    growth: '',
    description: 'Past 24 hours',
    note: 'from past 24 hours'
  },
  {
    key: 'week',
    title: 'This week',
    growth: '',
    description: 'Last 7 days',
    note: 'vs last week'
  },
  {
    key: 'month',
    title: 'This Month',
    growth: '',
    description: 'Last 30 days',
    note: 'vs previous month'
  }
];

// Dummy Data
const DUMMY_ANALYTICS = {
  today: { previous: 8500, current: 12842 },
  week: { previous: 240000, current: 284500 },
  month: { previous: 1100000, current: 1200000 }
};

const MonthlyChartData = [
  { month: 'January', stat: 186000 },
  { month: 'February', stat: 305000 },
  { month: 'March', stat: 237000 },
  { month: 'April', stat: 73000 },
  { month: 'May', stat: 209000 },
  { month: 'June', stat: 214000 },
  { month: 'July', stat: 268000 },
  { month: 'August', stat: 342000 },
  { month: 'September', stat: 295000 },
  { month: 'October', stat: 412000 },
  { month: 'November', stat: 378000 },
  { month: 'December', stat: 526000 }
];

const startMonth = MonthlyChartData[0].month;
const endMonth = MonthlyChartData[MonthlyChartData.length - 1].month;

const MonthlyChartStats = {
  key: 'Revenue',
  title: 'Monthly Revenue Overview',
  growth: '',
  description: `${startMonth} - ${endMonth} 2026`,
  note: 'All amounts are shown in Indian Rupees (₹ INR)'
};

export default function page() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-2 p-4 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">Overview</h1>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {pulseData.map((card, index) => (
            <PulseCard key={index} isRevenue={true} {...card} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">Revenue statistics</h1>
        <div className="no-scrollbar flex w-full gap-3 overflow-x-auto sm:grid sm:grid-cols-3 sm:gap-4 lg:gap-6">
          {' '}
          {revenueStats.map((stat) => (
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
              label="Revenue"
              key={stat.key}
              stat={stat}
              data={DUMMY_ANALYTICS[stat.key as keyof typeof DUMMY_ANALYTICS]}
              colors={{
                current: '#6D28D9',
                previous: '#DDD6FE'
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">Growth statistics</h1>{' '}
        <div className="no-scrollbar flex w-full flex-col items-center gap-3 overflow-x-auto sm:gap-4 lg:flex-row lg:gap-6">
          <div className="w-full flex-1 lg:min-w-[600px]">
            <AnalyticsBarChart
              key={MonthlyChartStats.key}
              stats={MonthlyChartStats}
              data={MonthlyChartData}
              label="Revenue"
            />
          </div>
          <div className="w-full flex-1 lg:min-w-[600px]">
            <AnalyticsLineChart
              key={MonthlyChartStats.key}
              stats={MonthlyChartStats}
              data={MonthlyChartData}
              label="Revenue"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
