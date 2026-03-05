import React from 'react';
import Link from 'next/link';

import { AlertTriangle, ArrowRight, Clock, Megaphone, Plus, UserRoundPlus } from 'lucide-react';

import { Button } from '~/shared/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/shared/shadcn/card';

interface QuickActionProps {
  label: string;
  icon?: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'orange';
}

export function QuickActionButton({ label, color, icon: Icon = Plus }: QuickActionProps) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-600  ring-emerald-500/20',
    red: 'bg-rose-50 text-rose-600  ring-rose-500/20',
    orange: 'bg-orange-50 text-orange-600  ring-orange-500/20',
    indigo: 'bg-indigo-50 text-indigo-600  ring-indigo-500/20',
    blue: 'bg-blue-50 text-blue-600  ring-blue-500/20'
  };

  return (
    <Button
      variant="outline"
      className="group bg-card hover:bg-card hover:border-primary/30 relative flex h-auto w-full items-center justify-start gap-3 rounded-xl p-3 transition-all duration-200">
      {/* Icon Container */}
      <div
        className={`bg-background ${colors[color]} group-hover:text-primary-foreground group-hover:bg-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors`}>
        <Icon className="h-4.5 w-4.5" />
      </div>

      {/* Text Content */}
      <div className="flex flex-col items-start gap-0.5">
        <span className="group-hover:text-primary text-sm font-semibold tracking-tight">
          {label}
        </span>
      </div>

      {/* Hover Reveal Arrow */}
      <ArrowRight className="text-muted-foreground/50 ml-auto h-4 w-4" />
    </Button>
  );
}

export function Complaints() {
  return (
    <div className="grid grid-cols-1 gap-y-4 md:grid-cols-3 md:gap-4 lg:gap-6">
      <Card className="col-span-2">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1 tracking-wider uppercase">
            (10) Open Complaints
          </CardTitle>
          <Link
            href={'#'}
            className="font-medium whitespace-nowrap text-orange-600 hover:underline">
            View all
          </Link>
        </CardHeader>

        <CardContent className="flex max-h-[250px] flex-col gap-3 overflow-hidden overflow-y-auto px-4 sm:px-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={`rounded-md border-l-4 border-red-400 bg-slate-50 p-3 shadow-sm`}>
              <div className="sm:text-md flex flex-wrap items-center gap-1 text-sm font-medium">
                <p>Water Leakage</p>
                <p className="text-foreground/80">- Room 204</p>
              </div>
              <p className="text-muted-foreground text-xs">2 hours ago</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-col gap-3">
        <h1 className="text-sm font-semibold tracking-widest uppercase">Quick Actions</h1>
        <QuickActionButton label="Add Resident" icon={UserRoundPlus} color="green" />
        <QuickActionButton label="View Pending Rents" icon={Clock} color="red" />
        <QuickActionButton label="View Complaints" icon={AlertTriangle} color="orange" />
        <QuickActionButton label="Add Notice" icon={Megaphone} color="blue" />
      </div>
    </div>
  );
}
