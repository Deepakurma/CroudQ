import React from 'react';

import { AppNavbar } from '~/components/nav-bar';
import { AuthGuard } from '~/components/utils/auth-guard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <main className="bg-background w-full">
        <AppNavbar />
        {children}
      </main>
    </AuthGuard>
  );
}
