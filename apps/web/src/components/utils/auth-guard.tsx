'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';

import { trpc } from '~/utils/trpc';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isLoading } = useQuery(trpc.auth.getSession.queryOptions());

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace('/auth/sign-in');
    }
  }, [router, session, isLoading]);

  if (isLoading) {
    return (
      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
        <LoaderCircle className="text-primary size-8 shrink-0 animate-spin sm:size-14" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
