'use client';

import { usePathname } from 'next/navigation';

import JoinFlowNavbar from '~/components/public/join-flow-navbar';

import type { ReactNode } from 'react';

export default function TenantLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();
  const shouldShowNavbar = pathname === '/tenant/status';

  return (
    <div className="relative">
      {shouldShowNavbar ? <JoinFlowNavbar /> : null}
      <main
        className={`flex flex-1 flex-col p-4 sm:p-5 ${shouldShowNavbar ? 'h-full' : 'h-screen'}`}>
        {children}
      </main>
    </div>
  );
}
