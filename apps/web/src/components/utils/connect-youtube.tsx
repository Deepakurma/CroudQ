'use client';

import { useMutation } from '@tanstack/react-query';
import { Youtube } from 'lucide-react';

import { Button } from '~/shared/shadcn/button';

import { trpc } from '~/utils/trpc';

export function ConnectYoutube() {
  const getOAuthUrl = useMutation(
    trpc.youtube.OAuthUrl.mutationOptions({
      onSuccess: ({ url }) => {
        window.location.href = url;
      }
    })
  );

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6">
      <div className="bg-card border-border/70 flex max-w-lg flex-col items-center rounded-3xl border p-8 text-center shadow-sm sm:p-12">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
          <Youtube className="size-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Let's Get You Started</h1>

        <p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">
          Connect your YouTube account to start syncing your videos, audience comments, and
          AI-driven insights with CroudQ.
        </p>

        <Button
          onClick={() =>
            getOAuthUrl.mutate({
              redirectTo: `${window.location.origin}/dashboard`
            })
          }
          disabled={getOAuthUrl.isPending}
          className="mt-8 w-full gap-2 px-6 py-2.5 text-sm shadow-sm sm:w-auto">
          {getOAuthUrl.isPending ? 'Connecting...' : 'Connect YouTube Account'}
        </Button>
      </div>
    </div>
  );
}
