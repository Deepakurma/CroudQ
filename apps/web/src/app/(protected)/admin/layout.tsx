import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { VENDOR_AUTH_COOKIE_NAME } from '~/lib/auth-cookies';
import { createServerTrpcClient } from '~/lib/server-trpc-client';
import { SidebarProvider } from '~/shared/shadcn/sidebar';

import AdminMobileNavigation from '~/components/admin-dashboard/mobile-navigations';
import AdminNavbar from '~/components/admin-dashboard/navbar';
import AdminSidebar from '~/components/admin-dashboard/sidebar';

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(VENDOR_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    redirect('/auth?redirect=/admin/dashboard');
  }

  try {
    const identity = await createServerTrpcClient({ token }).auth.getIdentity.query();
    if (!identity.roles.includes('SUPER_ADMIN')) {
      redirect('/auth?redirect=/admin/dashboard');
    }
  } catch {
    redirect('/auth?redirect=/admin/dashboard');
  }

  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminSidebar />
      <div className="relative box-border min-h-dvh w-full pb-20 font-sans lg:pb-5">
        <AdminNavbar />
        <AdminMobileNavigation />
        <main className="relative">{children}</main>
      </div>
    </SidebarProvider>
  );
}
