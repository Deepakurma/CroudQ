'use client';

import { useRouter } from 'next/navigation';

import { Building2, ChevronRight, Gem, HelpCircle, MessageSquareText, Network } from 'lucide-react';

import { Button } from '~/shared/shadcn/button';

export default function AdminQuickActions() {
  const router = useRouter();
  const actions = [
    { icon: <Building2 className="size-5" />, label: 'Landlords', href: '/admin/landlords' },
    { icon: <Network className="size-5" />, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: <HelpCircle className="size-5" />, label: 'Queries', href: '/admin/queries' },
    {
      icon: <MessageSquareText className="size-5" />,
      label: 'Feedbacks',
      href: '/admin/feedbacks'
    },
    { icon: <Gem className="size-5" />, label: 'Promotions', href: '/admin/promotions' }
  ];

  return (
    <div className="flex flex-col gap-2 p-4 px-0 sm:gap-3">
      <h1 className="text-sm font-semibold tracking-widest uppercase">Quick Actions</h1>

      <div className="flex flex-wrap items-center gap-5">
        {actions.map((action, idx) => (
          <Button
            variant={'secondary'}
            key={idx}
            onClick={() => router.push(action.href)}
            className={`group bg-card text-primary relative flex cursor-pointer items-center justify-between gap-2 rounded-3xl border p-5`}>
            {action.icon}

            <span className="group-hover:text-foreground text-muted-foreground text-[12px] font-bold tracking-tight uppercase sm:text-[13px]">
              {action.label}
            </span>
            <ChevronRight size={16} className="group-hover:text-foreground text-muted-foreground" />
          </Button>
        ))}
      </div>
    </div>
  );
}
