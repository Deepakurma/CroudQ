import { ArrowUpRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/shared/shadcn/card';

import PulseCard from '~/components/pulsecard';

function ProgressBar({
  value,
  max,
  color,
  label
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const percent = Math.round((value / max) * 100);
  return (
    <div className="group flex items-center gap-4 py-2">
      <div className="flex-1 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">
            {value} / {max}
          </span>
        </div>
        <div className="bg-muted-foreground/20 h-2 w-full overflow-hidden rounded-full">
          <div
            className={`h-full ${color} transition-all duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <div className="text-muted-foreground w-12 text-right text-xs font-bold">{percent}%</div>
    </div>
  );
}

export function RoomsAvailability() {
  return (
    <div className="grid grid-cols-1 gap-y-3 md:grid-cols-3 md:gap-4 lg:gap-6">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="tracking-wider uppercase">Room Availability</CardTitle>
          <CardDescription>Live capacity breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Side: Summary Box */}
            <div className="bg-background flex flex-col justify-center rounded-xl p-6">
              <span className="text-muted-foreground text-sm font-medium">Total Capacity</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold">140</span>
                <span className="text-muted-foreground text-sm font-medium">beds</span>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="bg-card flex items-center gap-1.5 rounded-md px-2.5 py-1.5 shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium">120 Occupied</span>
                </div>
                <div className="bg-card flex items-center gap-1.5 rounded-md px-2.5 py-1.5 shadow-sm">
                  <div className="bg-muted-foreground/50 h-2 w-2 rounded-full" />
                  <span className="text-xs font-medium">20 Vacant</span>
                </div>
              </div>
            </div>

            {/* Right Side: Bars */}
            <div className="max-h-[200px] space-y-1 overflow-hidden overflow-y-auto">
              <ProgressBar label="1 Person Room" value={18} max={20} color="bg-indigo-500" />
              <ProgressBar label="2 Person Room" value={45} max={60} color="bg-blue-500" />
              <ProgressBar label="3 Person Room" value={57} max={60} color="bg-sky-400" />
              <ProgressBar label="4 Person Room" value={40} max={50} color="bg-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>
      <PulseCard
        label="Occupancy Rate"
        value="70%"
        sub="Live occupancy"
        trend="down"
        color="green"
        icon={ArrowUpRight}
      />
    </div>
  );
}
