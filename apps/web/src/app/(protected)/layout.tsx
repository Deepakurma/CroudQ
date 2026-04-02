import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { SidebarProvider } from '~/shared/shadcn/sidebar';

import AdminMobileNavigation from '~/components/admin-dashboard/mobile-navigations';
import AdminNavbar from '~/components/admin-dashboard/navbar';
import { getServerAdminUser } from '~/utils/trpc-server';

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();

  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  try {
    await getServerAdminUser();
  } catch {
    redirect('/api/admin-auth/refresh?redirect=/admin');
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="bg-custom-background relative box-border min-h-dvh w-full pb-20 font-sans lg:pb-5">
        <AdminNavbar />
        <AdminMobileNavigation />
        <main className="relative p-4">{children}</main>
      </div>
    </SidebarProvider>
  );
}
