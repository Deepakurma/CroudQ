'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { IndianRupee, LayoutDashboard } from 'lucide-react';

interface MobileNavigationProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function AdminMobileNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const MobileNavButtons: MobileNavigationProps[] = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      active: pathname.startsWith('/admin'),
      onClick: () => router.push('/admin')
    },
    {
      icon: IndianRupee,
      label: 'Revenue',
      active: pathname.startsWith('/admin/subscriptions'),
      onClick: () => router.push('/admin/subscriptions')
    }
  ];

  return (
    <nav className="bg-card fixed right-0 bottom-0 left-0 z-50 flex h-16 items-center justify-evenly border-t px-4 sm:px-6 md:hidden">
      {MobileNavButtons.map((btn) => (
        <button
          key={btn.label}
          onClick={btn.onClick}
          className={`flex w-16 flex-col items-center gap-0.5 rounded-xl p-2 transition-colors active:scale-95 ${btn.active ? 'text-primary bg-primary/5' : 'text-muted-foreground'}`}>
          <btn.icon size={24} />
          <p className="text-[8px]">{btn.label}</p>
        </button>
      ))}
    </nav>
  );
}
