'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Loader2 } from 'lucide-react';

import { trpcClient } from '~/utils/trpc';

import type { ReactNode } from 'react';

type AdminAuthGuardProps = {
  children: ReactNode;
};

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [isAllowed, setIsAllowed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    const redirectToLogin = () => {
      const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.replace(`/auth/admin/login${redirect}`);
    };

    const verifyAdmin = async () => {
      try {
        await trpcClient.adminAuth.me.query();
        if (mounted) setIsAllowed(true);
      } catch {
        try {
          await trpcClient.adminAuth.refreshSession.mutate();
          await trpcClient.adminAuth.me.query();
          if (mounted) setIsAllowed(true);
        } catch {
          redirectToLogin();
        }
      }
    };

    verifyAdmin();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (!isAllowed) {
    return (
      <div className="text-muted-foreground sm:text-md flex h-[100dvh] w-full items-center justify-center gap-1 px-4 text-center text-sm font-medium">
        <Loader2 className="size-4 shrink-0 animate-spin sm:size-6" /> Checking admin session...
      </div>
    );
  }

  return <>{children}</>;
}
