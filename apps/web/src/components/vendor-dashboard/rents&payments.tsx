import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '~/shared/shadcn/card';

export function RentsAndPayments() {
  return (
    <div className="grid grid-cols-1 gap-y-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-6">
      <Card className="justify-between lg:col-span-2">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="tracking-wider uppercase">Rent & Payments</CardTitle>
          <Link
            href={'#'}
            className="font-medium whitespace-nowrap text-orange-600 hover:underline">
            View Payments
          </Link>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 md:gap-10">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Collection Progress</span>
              <span className="text-foreground font-bold">89%</span>
            </div>
            <div className="bg-muted-foreground/20 h-2 w-full overflow-hidden rounded-full">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                style={{ width: '89%' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-muted-foreground text-sm">Paid</p>
              <p className="mt-2 text-xl font-bold tracking-tight text-emerald-600 sm:text-2xl lg:text-3xl">
                100
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-muted-foreground text-sm">Pending</p>
              <p className="mt-2 text-xl font-bold tracking-tight text-red-600 sm:text-2xl lg:text-3xl">
                100
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-muted-foreground text-sm">Overdue</p>
              <p className="mt-2 text-xl font-bold tracking-tight text-amber-600 sm:text-2xl lg:text-3xl">
                100
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1 tracking-wider uppercase">
            (10) Recent Rent Payments
          </CardTitle>
          <Link
            href={'#'}
            className="font-medium whitespace-nowrap text-orange-600 hover:underline">
            View all
          </Link>
        </CardHeader>

        <CardContent className="flex max-h-[225px] flex-col gap-3 overflow-hidden overflow-y-auto px-4 sm:px-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className={`rounded-md border-l-4 border-amber-400 bg-slate-50 p-3 shadow-sm`}>
              <div className="sm:text-md flex flex-wrap items-center gap-1 text-sm font-medium">
                <p>Deepak kurma</p>
                <p className="text-foreground/80">- Room 306</p>
              </div>
              <p className="text-muted-foreground text-xs">2 hr ago</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
