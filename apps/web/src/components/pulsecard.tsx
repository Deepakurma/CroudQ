import React from 'react';
import Link from 'next/link';

import { TrendingDown, TrendingUp } from 'lucide-react';

import { Badge } from '~/shared/shadcn/badge';
import { Button } from '~/shared/shadcn/button';
import { Skeleton } from '~/shared/shadcn/skeleton';

import { formatNumber } from './number-formater';

export interface PulseCardProps {
  label: string;
  value: number | string;
  sub?: string;
  trend?: string;
  button?: string;
  buttonLink?: string | undefined;
  buttonOnClick?: () => void;
  isRevenue?: boolean;
  isLoading?: boolean;
  color: 'green' | 'red' | 'orange' | 'indigo' | 'blue';
  icon: React.ElementType;
}

export default function PulseCard({
  label,
  value,
  sub,
  trend,
  button,
  buttonLink,
  buttonOnClick,
  isRevenue,
  isLoading,
  color,
  icon: Icon
}: PulseCardProps) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-600  ring-emerald-500/20',
    red: 'bg-rose-50 text-rose-600  ring-rose-500/20',
    orange: 'bg-orange-50 text-orange-600  ring-orange-500/20',
    indigo: 'bg-indigo-50 text-indigo-600  ring-indigo-500/20',
    blue: 'bg-blue-50 text-blue-600  ring-blue-500/20'
  };

  return (
    <div className="group bg-card relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all lg:p-5">
      {/* Top Row: Icon and Trend Badge */}
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>

        {/* Trend Badge */}
        {trend && (
          <Badge
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold tracking-wider uppercase ${
              trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
            {trend === 'up' && <TrendingUp size={12} strokeWidth={2} />}
            {trend === 'down' && <TrendingDown size={12} strokeWidth={2} />}
          </Badge>
        )}

        {isLoading ? (
          button ? (
            <Skeleton className="h-7 w-16 rounded-md" />
          ) : null
        ) : button ? (
          buttonLink ? (
            <Link
              href={buttonLink}
              className={`font-medium ${colors[color]} bg-transparent text-sm shadow-none ring-0 hover:underline`}>
              {button}
            </Link>
          ) : buttonOnClick ? (
            <Button
              variant={'secondary'}
              onClick={buttonOnClick}
              className={`font-medium ${colors[color]} text-sm`}>
              {button}
            </Button>
          ) : null
        ) : null}
      </div>

      {/* Main Content */}
      <div className="space-y-1">
        {isLoading ? (
          <Skeleton className="h-8 w-24 sm:h-9 sm:w-28 lg:h-10 lg:w-32" />
        ) : (
          <h3 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
            {isRevenue && '₹'} {typeof value === 'number' ? formatNumber(value) : value}
          </h3>
        )}
        <div>
          {isLoading ? (
            <Skeleton className="mt-1 h-3.5 w-26 sm:w-30" />
          ) : (
            <p className="text-muted-foreground text-[12px] font-bold tracking-widest uppercase sm:text-[13px]">
              {label}
            </p>
          )}

          {isLoading ? (
            <Skeleton className="mt-1 h-3.5 w-36 sm:w-40" />
          ) : (
            <p className="text-muted-foreground/70 text-[11px] sm:text-[12px] sm:font-medium">
              {sub}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
