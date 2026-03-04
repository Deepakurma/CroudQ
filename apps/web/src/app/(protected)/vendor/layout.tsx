import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { VENDOR_AUTH_COOKIE_NAME } from '~/lib/auth-cookies';
import { createServerTrpcClient } from '~/lib/server-trpc-client';
import { SidebarProvider } from '~/shared/shadcn/sidebar';

import VendorNavbar from '~/components/vendor-dashboard/navbar';

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(VENDOR_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    redirect('/auth?redirect=/vendor/onboarding');
  }

  try {
    const identity = await createServerTrpcClient({ token }).auth.getIdentity.query();
    const canAccessVendorLayout = identity.roles.includes('VENDOR') || identity.needsOnboarding;
    if (!canAccessVendorLayout) {
      redirect('/auth?redirect=/vendor/onboarding');
    }
  } catch {
    redirect('/auth?redirect=/vendor/onboarding');
  }

  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="relative box-border min-h-dvh w-full font-sans">
        <VendorNavbar />
        <main className="relative p-4 sm:gap-5 sm:p-6">{children}</main>
      </div>
    </SidebarProvider>
  );
}
