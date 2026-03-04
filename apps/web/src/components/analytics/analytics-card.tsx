'use client';

// import { useEffect, useState } from 'react';
import clsx from 'clsx';
// import { AlertTriangle, Loader2 } from 'lucide-react';
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/shared/shadcn/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '~/shared/shadcn/chart';

import { formatNumber } from '../number-formater';

import type { ChartConfig } from '~/shared/shadcn/chart';

export const description = 'A radial chart with stacked sections';

interface StatProp {
  key: string;
  title: string;
  growth: string;
  description: string;
  note: string;
}

function getGrowthMetrics(previous: number, current: number) {
  // These cards represent growth snapshots; show "Decreased" only on true vendor base drop.
  // When there is no increase versus previous period, keep it as 0% increase.
  if (current <= previous) {
    return { isDecrease: false, percentage: '0.0%' };
  }

  if (previous <= 0) {
    return { isDecrease: false, percentage: '100.0%' };
  }

  const rawGrowth = ((current - previous) / previous) * 100;
  return {
    isDecrease: false,
    percentage: `${Math.abs(rawGrowth).toFixed(1)}%`
  };
}

interface AnalyticsCardProps {
  stat: StatProp;
  data: { previous: number; current: number };
  colors?: {
    current?: string;
    previous?: string;
  };
}

export function AnalyticsCard({ stat, data, colors }: AnalyticsCardProps) {
  const totalVisitors = data.current;
  const growth = getGrowthMetrics(data.previous, data.current);

  const chartConfig: ChartConfig = {
    previous: {
      label: 'Previous',
      color: colors?.previous || 'var(--chart-2)'
    },
    current: {
      label: 'Current',
      color: colors?.current || 'var(--chart-1)'
    }
  };

  return (
    <Card className="flex min-w-[200px] flex-col gap-5 py-4 md:py-5">
      <CardHeader className="items-center gap-0 pb-0">
        <CardTitle className="text-muted-foreground text-[12px] font-bold tracking-widest uppercase md:text-[13px]">
          {stat.title}
        </CardTitle>
        <CardDescription className="text-muted-foreground/70 text-[11px] sm:text-[12px] sm:font-medium">
          {stat.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 items-center">
        <ChartContainer config={chartConfig} className="h-[150px] w-full">
          <RadialBarChart
            data={[{ previous: data.previous, current: data.current, total: totalVisitors }]}
            width={100}
            height={100}
            endAngle={180}
            innerRadius={60}
            outerRadius={100}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-xl font-bold tracking-tight sm:text-2xl">
                          {formatNumber(totalVisitors)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground text-sm">
                          Vendors
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="current"
              fill="var(--color-current)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="previous"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-previous)"
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>

      {/* <CardFooter className="mt-[-60px] flex-col gap-2 text-xs lg:text-sm">
        <p className="text-center leading-none font-medium">
          Increased by{' '}
          <em
            className={clsx(
              'rounded-s px-1 py-0.5',
              stat.growth.startsWith('-')
                ? 'bg-red-100 text-red-600'
                : 'bg-green-100 text-green-600'
            )}>
            {stat.growth}
          </em>{' '}
          {stat.note}
        </p>
        <div className="text-muted-foreground text-center text-[10px] leading-none sm:text-xs">
          Based on activity from the {stat.description.toLowerCase()}.
        </div>
      </CardFooter> */}
      <CardFooter className="mt-[-45px] flex-col gap-2 text-xs lg:text-sm">
        <p className="text-muted-foreground/70 text-center leading-none sm:font-medium">
          {growth.isDecrease ? 'Decreased' : 'Increased'} by{' '}
          <em
            className={clsx(
              'rounded px-1 py-0.5 font-bold not-italic',
              growth.isDecrease ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
            )}>
            {growth.percentage}
          </em>{' '}
          {stat.note}
        </p>
      </CardFooter>
    </Card>
  );
}
