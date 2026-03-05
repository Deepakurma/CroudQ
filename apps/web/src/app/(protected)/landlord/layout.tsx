import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { LANDLORD_AUTH_COOKIE_NAME } from '~/lib/auth-cookies';
import { createServerTrpcClient } from '~/lib/server-trpc-client';
import { SidebarProvider } from '~/shared/shadcn/sidebar';

import LandlordNavbar from '~/components/landlord-dashboard/navbar';

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(LANDLORD_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    redirect('/auth?redirect=/landlord/onboarding');
  }

  try {
    const identity = await createServerTrpcClient({ token }).auth.getIdentity.query();
    const canAccessLandlordLayout = identity.roles.includes('LANDLORD') || identity.needsOnboarding;
    if (!canAccessLandlordLayout) {
      redirect('/auth?redirect=/landlord/onboarding');
    }
  } catch {
    redirect('/auth?redirect=/landlord/onboarding');
  }

  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="relative box-border min-h-dvh w-full font-sans">
        <LandlordNavbar />
        <main className="relative p-4 sm:gap-5 sm:p-6">{children}</main>
      </div>
    </SidebarProvider>
  );
}
