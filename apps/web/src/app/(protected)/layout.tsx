import React from 'react';
import { cookies } from 'next/headers';

import { SidebarProvider } from '~/shared/shadcn/sidebar';

import AdminAuthGuard from '~/components/admin-dashboard/admin-auth-guard';
import AdminMobileNavigation from '~/components/admin-dashboard/mobile-navigations';
import AdminNavbar from '~/components/admin-dashboard/navbar';

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();

  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminAuthGuard>
        <div className="relative box-border min-h-dvh w-full pb-20 font-sans lg:pb-5">
          <AdminNavbar />
          <AdminMobileNavigation />
          <main className="relative p-4">{children}</main>
        </div>
      </AdminAuthGuard>
    </SidebarProvider>
  );
}
