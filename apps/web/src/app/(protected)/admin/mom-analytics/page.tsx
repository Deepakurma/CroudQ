'use client';

import { useEffect, useMemo, useState } from 'react';

import { AnalyticsBarChart } from '~/components/analytics/analytics-barchart';
import { AnalyticsLineChart } from '~/components/analytics/analytics-linechart';
import { trpcClient } from '~/utils/trpc';

const MonthlyLandlordsData = [
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

const landlordsStartMonth = MonthlyLandlordsData[0].month;
const landlordsEndMonth = MonthlyLandlordsData[MonthlyLandlordsData.length - 1].month;

const MonthlyLandlordsStats = {
  key: 'Landlords',
  title: 'Monthly Landlords Overview',
  growth: '',
  description: `${landlordsStartMonth} - ${landlordsEndMonth} 2026`
};

// -----------

const MonthlyUsersData = [
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

const usersStartMonth = MonthlyUsersData[0].month;
const usersEndMonth = MonthlyUsersData[MonthlyUsersData.length - 1].month;

const MonthlyusersStats = {
  key: 'Users',
  title: 'Monthly Users Overview',
  growth: '',
  description: `${usersStartMonth} - ${usersEndMonth} 2026`
};

export default function page() {
  const [data, setData] = useState<{
    landlords: Array<{ month: string; stat: number }>;
    users: Array<{ month: string; stat: number }>;
    description: string;
  } | null>(null);

  useEffect(() => {
    const fetchMoMAnalytics = async () => {
      try {
        const payload = await trpcClient.admin.getMomAnalytics.query();
        setData(payload);
      } catch {
        setData(null);
      }
    };

    void fetchMoMAnalytics();
  }, []);

  const landlordStats = useMemo(
    () => ({
      ...MonthlyLandlordsStats,
      description: data?.description || MonthlyLandlordsStats.description
    }),
    [data]
  );

  const userStats = useMemo(
    () => ({
      ...MonthlyusersStats,
      description: data?.description || MonthlyusersStats.description
    }),
    [data]
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-2 p-4 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">
          Landlords Growth statistics
        </h1>{' '}
        <div className="no-scrollbar flex w-full flex-col items-start gap-3 overflow-x-auto sm:gap-4 lg:flex-row lg:gap-6">
          <div className="w-full flex-1 lg:min-w-[600px]">
            <AnalyticsBarChart
              key={landlordStats.key}
              stats={landlordStats}
              data={data?.landlords || MonthlyLandlordsData}
              label="Revenue"
              color="var(--chart-3)"
            />
          </div>
          <div className="w-full flex-1 lg:min-w-[600px]">
            <AnalyticsLineChart
              key={landlordStats.key}
              stats={landlordStats}
              data={data?.landlords || MonthlyLandlordsData}
              label="Revenue"
              color="var(--chart-3)"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4 sm:gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">Users Growth statistics</h1>{' '}
        <div className="no-scrollbar flex w-full flex-col items-center gap-3 overflow-x-auto sm:gap-4 lg:flex-row lg:gap-6">
          <div className="w-full flex-1 lg:min-w-[600px]">
            <AnalyticsBarChart
              key={userStats.key}
              stats={userStats}
              data={data?.users || MonthlyUsersData}
              label="Users"
            />
          </div>
          <div className="w-full flex-1 lg:min-w-[600px]">
            <AnalyticsLineChart
              key={userStats.key}
              stats={userStats}
              data={data?.users || MonthlyUsersData}
              label="Users"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
