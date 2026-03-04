'use client';

import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/shared/shadcn/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '~/shared/shadcn/chart';

import type { ChartConfig } from '~/shared/shadcn/chart';

export const description = 'A horizontal bar chart';

interface StatsProp {
  key: string;
  title: string;
  growth?: string;
  description: string;
  note?: string;
}

interface ChartData {
  month: string;
  stat: number;
}

interface BarChartProps {
  stats: StatsProp;
  data: ChartData[];
  color?: string;
  label?: string;
}

export function AnalyticsBarChart({ stats, data, color, label }: BarChartProps) {
  const chartConfig: ChartConfig = {
    stat: {
      label: label || 'Stat',
      color: color || 'var(--chart-1)'
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-[12px] font-bold tracking-widest uppercase md:text-[13px]">
          {stats.title}
        </CardTitle>
        <CardDescription>{stats.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              left: -20
            }}>
            <XAxis type="number" dataKey="stat" hide />
            <YAxis
              dataKey="month"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />

            <Bar dataKey="stat" fill="var(--color-stat)" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {stats.growth?.trim() && (
          <div className="flex gap-2 leading-none font-medium">
            Trending up by {stats.growth} this month <TrendingUp className="h-4 w-4" />
          </div>
        )}
        {stats.note?.trim() && (
          <div className="text-muted-foreground leading-none">{stats.note}</div>
        )}
      </CardFooter>
    </Card>
  );
}
