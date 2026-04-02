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
    redirect('/auth/admin/login?redirect=/admin');
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="relative box-border min-h-dvh w-full bg-[rgb(245,245,245)] pb-20 font-sans lg:pb-5">
        <AdminNavbar />
        <AdminMobileNavigation />
        <main className="relative p-4">{children}</main>
      </div>
    </SidebarProvider>
  );
}
