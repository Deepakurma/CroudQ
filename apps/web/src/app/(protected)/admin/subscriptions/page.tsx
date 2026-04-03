'use client';

import { useEffect, useMemo, useState } from 'react';

import { Clock3, IndianRupee, WalletCards } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '~/shared/shadcn/card';

import { AnalyticsBarChart } from '~/components/analytics/analytics-barchart';
import { AnalyticsCard } from '~/components/analytics/analytics-card';
import { AnalyticsLineChart } from '~/components/analytics/analytics-linechart';
import PulseCard from '~/components/pulsecard';
import { trpcClient } from '~/utils/trpc';

import type { PulseCardProps } from '~/components/pulsecard';

const revenueStats = [
  {
    key: 'today',
    title: 'Today',
    description: 'Past 24 hours',
    note: 'from past 24 hours'
  },
  {
    key: 'week',
    title: 'This week',
    description: 'Last 7 days',
    note: 'vs last week'
  },
  {
    key: 'month',
    title: 'This month',
    description: 'Last 30 days',
    note: 'vs previous month'
  }
] as const;

const EMPTY_OVERVIEW = {
  summary: {
    totalRevenue: 0,
    totalSubscriptions: 0,
    pendingSubscriptions: 0
  },
  revenueStats: {
    today: { previous: 0, current: 0 },
    week: { previous: 0, current: 0 },
    month: { previous: 0, current: 0 }
  },
  monthlyRevenue: []
};

type AdminBillingOverview = Awaited<ReturnType<typeof trpcClient.adminBilling.overview.query>>;

const toMajorCurrencyAmount = (amount: number) => amount / 100;

function calculateGrowth(previous: number, current: number) {
  if (previous === 0) return current > 0 ? '100%' : '0%';

  const growth = ((current - previous) / previous) * 100;
  if (growth <= 0) return '0%';

  return `${growth.toFixed(1)}%`;
}

export default function SubscriptionsPage() {
  const [overview, setOverview] = useState<AdminBillingOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchBillingOverview = async () => {
      setIsLoading(true);

      try {
        const data = await trpcClient.adminBilling.overview.query();
        if (mounted) {
          setOverview(data);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to load subscription analytics.';
        toast.error(message);
        if (mounted) {
          setOverview(EMPTY_OVERVIEW);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchBillingOverview();

    return () => {
      mounted = false;
    };
  }, []);

  const data = overview ?? EMPTY_OVERVIEW;
  const revenueData = useMemo(
    () => ({
      summary: {
        totalRevenue: toMajorCurrencyAmount(data.summary.totalRevenue)
      },
      revenueStats: {
        today: {
          previous: toMajorCurrencyAmount(data.revenueStats.today.previous),
          current: toMajorCurrencyAmount(data.revenueStats.today.current)
        },
        week: {
          previous: toMajorCurrencyAmount(data.revenueStats.week.previous),
          current: toMajorCurrencyAmount(data.revenueStats.week.current)
        },
        month: {
          previous: toMajorCurrencyAmount(data.revenueStats.month.previous),
          current: toMajorCurrencyAmount(data.revenueStats.month.current)
        }
      },
      monthlyRevenue: data.monthlyRevenue.map((entry) => ({
        ...entry,
        stat: toMajorCurrencyAmount(entry.stat)
      }))
    }),
    [data]
  );
  const hasMonthlyRevenue = data.monthlyRevenue.length > 0;

  const pulseData: PulseCardProps[] = useMemo(
    () => [
      {
        label: 'Total Revenue',
        value: revenueData.summary.totalRevenue,
        sub: 'All paid subscription revenue',
        color: 'green',
        icon: IndianRupee,
        isRevenue: true
      },
      {
        label: 'Active Subscriptions',
        value: data.summary.totalSubscriptions,
        sub: 'Currently active subscriptions',
        color: 'blue',
        icon: WalletCards
      },
      {
        label: 'Pending Renewals',
        value: data.summary.pendingSubscriptions,
        sub: 'Ended subscriptions without renewal',
        color: 'orange',
        icon: Clock3
      }
    ],
    [
      revenueData.summary.totalRevenue,
      data.summary.pendingSubscriptions,
      data.summary.totalSubscriptions
    ]
  );

  const monthlyChartStats = useMemo(() => {
    const firstMonth = data.monthlyRevenue[0]?.month;
    const lastMonth = data.monthlyRevenue[data.monthlyRevenue.length - 1]?.month;

    return {
      key: 'Revenue',
      title: 'Monthly Revenue Overview',
      growth: hasMonthlyRevenue
        ? calculateGrowth(
            revenueData.revenueStats.month.previous,
            revenueData.revenueStats.month.current
          )
        : undefined,
      description: firstMonth && lastMonth ? `${firstMonth} - ${lastMonth}` : 'No revenue data yet',
      note: 'Based on successful subscription charge events'
    };
  }, [revenueData.revenueStats.month, data.monthlyRevenue, hasMonthlyRevenue]);

  return (
    <div className="mx-auto flex max-w-7xl flex-1 flex-col gap-6 overflow-hidden">
      <div className="flex flex-col gap-2 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">Overview</h1>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
          {pulseData.map((card) => (
            <PulseCard key={card.label} isLoading={isLoading} {...card} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">Revenue statistics</h1>
        <div className="no-scrollbar flex w-full gap-3 overflow-x-auto sm:grid sm:grid-cols-3 sm:gap-4 lg:gap-6">
          {revenueStats.map((stat) => {
            const revenueStatData = revenueData.revenueStats[stat.key];
            return (
              <AnalyticsCard
                label="Revenue"
                key={stat.key}
                stat={{
                  ...stat,
                  growth: calculateGrowth(revenueStatData.previous, revenueStatData.current)
                }}
                data={revenueStatData}
                colors={{
                  current: '#6D28D9',
                  previous: '#DDD6FE'
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">Growth statistics</h1>
        {hasMonthlyRevenue ? (
          <div className="no-scrollbar flex w-full flex-col items-center gap-3 overflow-x-auto sm:gap-4 lg:flex-row lg:gap-6">
            <div className="w-full flex-1 lg:min-w-[600px]">
              <AnalyticsBarChart
                key={`${monthlyChartStats.key}-bar`}
                stats={monthlyChartStats}
                data={revenueData.monthlyRevenue}
                label="Revenue"
              />
            </div>
            <div className="w-full flex-1 lg:min-w-[600px]">
              <AnalyticsLineChart
                key={`${monthlyChartStats.key}-line`}
                stats={monthlyChartStats}
                data={revenueData.monthlyRevenue}
                label="Revenue"
              />
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground text-[12px] font-bold tracking-widest uppercase md:text-[13px]">
                Monthly Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Revenue charts will appear once subscription charge history is available.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
