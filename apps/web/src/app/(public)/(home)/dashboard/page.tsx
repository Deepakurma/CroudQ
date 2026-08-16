'use client';

import React, { useEffect } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  RefreshCw,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Youtube
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '~/lib/utils';
import { Badge } from '~/shared/shadcn/badge';
import { Button } from '~/shared/shadcn/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/shared/shadcn/card';

import { ConnectYoutube } from '~/components/utils/connect-youtube';
import { EmptyState } from '~/components/utils/empty-state';
import { Loader } from '~/components/utils/loader';
import { trpc } from '~/utils/trpc';

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const {
    data: insightQuery,
    isPending: insightsPending,
    mutate: refreshInsights
  } = useMutation(
    trpc.insights.insight.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      }
    })
  );

  useEffect(() => {
    console.log('DASHBOARD MOUNT');

    return () => {
      console.log('DASHBOARD UNMOUNT');
    };
  }, []);

  useEffect(() => {
    console.log('CALLING refreshInsights');
    refreshInsights({ forceRefresh: false });
  }, []);

  const syncYoutube = useMutation(
    trpc.youtube.sync.mutationOptions({
      onSuccess: () => {
        toast.success('YouTube data synced');
        void queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
      }
    })
  );

  const artifact = insightQuery?.artifact;
  const payload = artifact?.payload;
  const currentCommentCount = insightQuery?.currentCommentCount ?? 0;
  const viewCount = insightQuery?.viewsCount;
  const likesCount = insightQuery?.likesCount;
  const canRegenerate = insightQuery?.canRegenerate ?? false;
  const channelName = insightQuery?.channelName;

  const isBusy = syncYoutube.isPending || insightsPending;

  const isYoutubeConnected = insightQuery?.hasYoutubeAccount;

  const videoTitle = insightQuery?.videoTitle ?? '';

  const onSync = async () => {
    await syncYoutube.mutateAsync({});
  };

  const onRefresh = async () => {
    refreshInsights({ forceRefresh: true });
  };

  if (insightsPending) {
    return <Loader />;
  }

  if (!insightQuery) {
    return <EmptyState text="No Enough Data" />;
  }

  if (!isYoutubeConnected) {
    return <ConnectYoutube />;
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      {/* ── Header ── */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Youtube className="size-3 text-red-500 sm:size-4" />
            <span className="text-muted-foreground text-[9px] font-medium tracking-widest text-red-500 uppercase sm:text-[10px]">
              YouTube
            </span>
          </div>
          <h1 className="text-xl font-semibold sm:text-2xl">Hey {channelName}!</h1>
          <p className="text-muted-foreground hidden text-xs leading-relaxed sm:block sm:text-sm">
            Showing analysis of video:{' '}
            {videoTitle.length > 40 ? `${videoTitle.slice(0, 40)}...` : videoTitle}
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed sm:hidden sm:text-sm">
            {videoTitle.length > 20 ? `${videoTitle.slice(0, 20)}...` : videoTitle}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap">
          <Button variant="outline" size="sm" onClick={onSync} disabled={isBusy} className="gap-2">
            <RefreshCw
              className={cn('h-4 w-4 text-red-500', syncYoutube.isPending && 'animate-spin')}
            />
            {syncYoutube.isPending || insightsPending ? 'Syncing…' : 'Sync'}
          </Button>
          <Button
            size="sm"
            onClick={onRefresh}
            disabled={isBusy || !canRegenerate}
            className="gap-2">
            <RefreshCw className={cn('h-4 w-4', insightsPending && 'animate-spin')} />
            {insightsPending || syncYoutube.isPending ? 'Refreshing…' : 'Refresh '}
          </Button>
        </div>
      </div>

      {/* ── Stat Strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Comments"
          value={currentCommentCount}
          icon={<MessageSquare className="text-primary h-4 w-4" />}
        />
        <StatCard
          label="Views"
          value={viewCount || 0}
          icon={<Eye className="h-4 w-4 text-amber-500" />}
        />
        <StatCard
          label="Likes"
          value={likesCount || 0}
          icon={<Heart className="h-4 w-4 text-red-500" />}
        />
        <StatCard
          label="Last updated"
          value={
            artifact?.createdAt ? formatDistanceToNow(artifact.createdAt, { addSuffix: true }) : '—'
          }
          icon={<Clock className="text-muted-foreground h-4 w-4" />}
          valueClass="text-sm font-medium"
        />
      </div>

      {/* ── Empty state ── */}
      {!payload ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold">No insights yet</h2>
              <p className="text-muted-foreground max-w-xs text-sm">
                Sync your YouTube channel first, then collect enough comments to generate AI
                insights.
              </p>
            </div>
            <Button size="sm" onClick={onSync} disabled={isBusy} className="gap-2">
              <Youtube className="h-4 w-4 text-red-500" />
              {syncYoutube.isPending ? 'Syncing…' : 'Sync YouTube'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Sentiment Summary ── */}
          <div className="relative overflow-hidden rounded-2xl border-1 border-indigo-500/20 bg-gradient-to-br from-indigo-500/40 via-indigo-500/20 to-transparent">
            {/* Soft glow */}
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-indigo-500/20" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-500/20" />

            <div className="bg-background/80 relative rounded-2xl p-6 backdrop-blur-xl sm:p-7">
              {/* Header */}
              <div className="mb-6 flex items-center gap-3">
                <div className="text-primary flex shrink-0 items-center justify-center rounded-xl border border-indigo-500/10 bg-indigo-500/10 p-2">
                  <Sparkles className="size-6 shrink-0" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Sentiment Summary</h2>

                  <p className="text-muted-foreground text-sm">
                    AI overview of your audience's sentiment.
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
                {/* Left */}
                <div className="flex-[2] space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'rounded-full px-3 py-1 font-medium',
                        payload.sentimentCard.dominantTone === 'positive' &&
                          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                        payload.sentimentCard.dominantTone === 'neutral' &&
                          'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                        payload.sentimentCard.dominantTone === 'negative' &&
                          'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      )}>
                      {formatTone(payload.sentimentCard.dominantTone)}
                    </Badge>

                    <span className="text-muted-foreground text-sm">
                      {payload.sentimentCard.positivePercent}% positive
                    </span>
                  </div>

                  <p className="text-muted-foreground max-w-xl">{payload.sentimentCard.subtext}</p>
                </div>

                {/* Right */}
                <div className="w-full space-y-4 sm:flex-1">
                  {payload.sentimentCard.split.map((item) => (
                    <div key={item.tone} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{item.tone}</span>

                        <span className="text-muted-foreground">{item.value}%</span>
                      </div>

                      <div className="bg-muted h-2 overflow-hidden rounded-full">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-700',
                            item.tone === 'positive' && 'bg-emerald-500',
                            item.tone === 'neutral' && 'bg-amber-500',
                            item.tone === 'negative' && 'bg-rose-500'
                          )}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 2: Needs Attention (full width) ── */}
          <div className="relative overflow-hidden rounded-2xl border border-red-500/15 bg-gradient-to-br from-red-500/15 via-orange-500/5 to-transparent">
            {/* Soft background glows */}
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-red-500/10 blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-orange-500/10 blur-[80px]" />

            {/* Content wrapper with glass effect */}
            <div className="bg-background/60 relative backdrop-blur-xl">
              <Card className="border-none bg-transparent shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-500">
                      <TriangleAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold tracking-tight">
                        Needs Attention
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Issues worth addressing in your content or replies
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {payload.needsAttention.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">
                      No major issues in comments yet.
                    </p>
                  ) : (
                    <div className="w-full space-y-3">
                      {payload.needsAttention.map((issue) => (
                        <div
                          key={issue.id}
                          className="space-y-1.5 rounded-xl border border-red-500/10 bg-red-500/5 p-4 transition-colors hover:bg-red-500/10 dark:border-red-500/20 dark:bg-red-500/10">
                          <p className="text-sm leading-snug font-medium text-red-700 dark:text-red-400">
                            {issue.title}
                          </p>
                          <p className="text-muted-foreground text-xs leading-relaxed">
                            {issue.implication}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ── Row 1: Top Themes + Next Move ── */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Top Themes */}
            <Card className="flex flex-col">
              <CardHeader className="px-4 pb-3 sm:px-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-base font-semibold">Top Themes</CardTitle>
                </div>
                <CardDescription className="text-sm">What viewers keep mentioning</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 px-4 sm:px-6">
                {payload.topThemes.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center text-sm">
                    No strong themes yet.
                  </p>
                ) : (
                  payload.topThemes.map((theme) => (
                    <div
                      key={theme.id}
                      className="space-y-2 rounded-xl border border-blue-200/60 bg-blue-50/50 p-3 dark:border-blue-500/20 dark:bg-blue-500/5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm leading-snug font-medium">{theme.title}</p>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {theme.count} comment{theme.count === 1 ? '' : 's'}
                          </p>
                        </div>
                        <span className="rounded-md bg-blue-200/40 px-1.5 py-0.5 text-[11px] font-medium text-blue-500 dark:bg-blue-500/10">
                          #{theme.id}
                        </span>
                      </div>

                      {theme.quotes.length > 0 && (
                        <div className="space-y-1.5 border-t pt-2">
                          {theme.quotes.map((quote) => (
                            <p
                              key={quote}
                              className="text-muted-foreground text-xs leading-relaxed italic">
                              "{quote}"
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Next Move */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <CardTitle className="text-base font-semibold">Next Move</CardTitle>
                </div>
                <CardDescription className="text-sm">Strongest recommended action</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                {/* Recommendation block */}
                <div className="space-y-1.5 rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm leading-snug font-medium">
                      {payload.nextContentMove.title}
                    </p>
                    <Badge variant="secondary" className="text-[11px]">
                      {payload.nextContentMove.tag}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {payload.nextContentMove.evidenceLine}
                  </p>
                </div>

                {/* Steps */}
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                    Steps
                  </p>
                  <ul className="space-y-1.5">
                    {payload.nextContentMove.steps.map((step) => (
                      <li key={step} className="flex items-center gap-2 text-sm">
                        <ArrowRight className="text-primary size-5 shrink-0" />
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Reasons */}
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase">
                    Why this works
                  </p>
                  <ul className="space-y-1.5">
                    {payload.nextContentMove.reasons.map((reason) => (
                      <li key={reason} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-muted-foreground">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  valueClass
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="bg-card space-y-2 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">{label}</p>
        {icon}
      </div>
      <p className={cn('text-xl leading-none font-bold', valueClass)}>{value}</p>
    </div>
  );
}

function formatTone(tone: string) {
  if (tone === 'positive') return 'Positive';
  if (tone === 'neutral') return 'Neutral';
  if (tone === 'negative') return 'Negative';
  return 'Unavailable';
}
