'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { trpcClient } from '~/utils/trpc';

import type { ReactNode } from 'react';

type AuthUser = Awaited<ReturnType<typeof trpcClient.auth.me.query>>;

type CreatorWebAuthGuardProps = {
  children: (user: AuthUser) => ReactNode;
};

export default function CreatorWebAuthGuard({ children }: CreatorWebAuthGuardProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let mounted = true;

    if (searchParams.get('error') === 'invalid-upgrade-link') {
      toast.error('This upgrade link is invalid or expired.');
    }

    const redirectToLanding = () => {
      router.replace('/');
    };

    const verifySession = async () => {
      try {
        const currentUser = await trpcClient.auth.me.query();
        if (mounted) {
          setUser(currentUser);
        }
      } catch {
        try {
          const refreshedUser = await trpcClient.auth.refreshWebSession.mutate();
          if (mounted) {
            setUser(refreshedUser);
          }
        } catch {
          redirectToLanding();
        }
      }
    };

    void verifySession();

    return () => {
      mounted = false;
    };
  }, [pathname, router, searchParams]);

  if (!user) {
    return (
      <div className="text-muted-foreground flex min-h-[60dvh] w-full items-center justify-center gap-2 px-4 text-center text-sm font-medium">
        <Loader2 className="size-4 animate-spin" /> Checking your secure session...
      </div>
    );
  }

  return <>{children(user)}</>;
}
