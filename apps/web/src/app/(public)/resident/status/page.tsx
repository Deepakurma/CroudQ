'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

import { getPublicErrorMessage } from '~/lib/trpc-error';
import { Button } from '~/shared/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/shared/shadcn/card';

import { trpcClient } from '~/utils/trpc';

type MyStatusPayload = {
  status: 'none' | 'invited' | 'submitted' | 'approved' | 'rejected' | 'expired';
  source: 'active_tenancy' | 'latest_request' | 'no_records';
  inviteCode?: string;
  property?: {
    name: string;
  };
  room?: {
    roomNumber: string;
    roomType: string;
  } | null;
};

export default function JoinStatusOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<MyStatusPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);
  const [shouldPoll, setShouldPoll] = useState(false);

  const handleBackHomeAndLogout = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      await trpcClient.auth.logout.mutate();
    } finally {
      router.replace('/');
      router.refresh();
      setIsLeaving(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchStatus = async () => {
      try {
        const payload = await trpcClient.publicResident.getMyJoinOrResidencyStatus.query();

        if (active) {
          setData(payload);
          setShouldPoll(payload?.status === 'submitted');
          setError('');
        }
      } catch (fetchError: unknown) {
        const trpcError = fetchError as { data?: { code?: string }; message?: string };
        if (trpcError?.data?.code === 'UNAUTHORIZED') {
          router.replace('/resident/auth?redirect=%2Fresident%2Fstatus');
          return;
        }
        if (active) {
          setShouldPoll(false);
          setError(getPublicErrorMessage(fetchError, 'Unable to fetch status.'));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void fetchStatus();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!shouldPoll) return;

    let active = true;
    const interval = setInterval(async () => {
      if (!active) return;
      try {
        const payload = await trpcClient.publicResident.getMyJoinOrResidencyStatus.query();
        if (!active) return;
        setData(payload);
        setShouldPoll(payload?.status === 'submitted');
      } catch {
        if (!active) return;
        setShouldPoll(false);
      }
    }, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [shouldPoll]);

  return (
    <main className="m-auto w-full max-w-2xl">
      <Card className="rounded-3xl border shadow-sm">
        {isLoading ? (
          <CardContent className="text-muted-foreground flex items-center justify-center py-16 text-xs sm:text-sm">
            <Loader2 className="mr-2 size-4 animate-spin sm:size-5" /> Checking your status...
          </CardContent>
        ) : error ? (
          <CardContent className="space-y-4 py-12 text-center">
            <div className="flex justify-center">
              <AlertTriangle className="text-destructive size-8" />
            </div>
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-xl">Join Request Status</CardTitle>
              <p className="text-muted-foreground text-sm">
                {data?.property?.name || 'Property'} • Room {data?.room?.roomNumber || 'N/A'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.status === 'approved' ? (
                <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <CheckCircle2 className="size-5" /> Request Approved
                  </div>
                  <p className="text-sm">
                    Your request has been approved. Download Bunkezy app and login with your phone
                    number.
                  </p>
                </div>
              ) : null}

              {data?.status === 'submitted' ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Your request is submitted and pending approval. Keep this page open or check back
                  shortly.
                </div>
              ) : null}

              {data?.status === 'rejected' ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                  Your request was rejected. Please contact the property manager.
                </div>
              ) : null}

              {data?.status === 'expired' ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  This invite is expired. Please ask property manager for a fresh invite link.
                </div>
              ) : null}

              {data?.status === 'none' || data?.status === 'invited' ? (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900">
                  <p className="text-base font-medium">
                    You&apos;re currently not joined in any property.
                  </p>
                  <p className="text-sm">The property you join will appear here.</p>
                  <Button variant="outline" onClick={handleBackHomeAndLogout} disabled={isLeaving}>
                    Back to Home
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </>
        )}
      </Card>
    </main>
  );
}
