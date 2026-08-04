'use client';

import React from 'react';
import Image from 'next/image';

import { useInfiniteQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Eye, Heart, MessageCircle, Play, RefreshCw, Sparkles } from 'lucide-react';

import { Badge } from '~/shared/shadcn/badge';
import { Button } from '~/shared/shadcn/button';
import { Card } from '~/shared/shadcn/card';

import { EmptyState } from '~/components/utils/empty-state';
import { Loader } from '~/components/utils/loader';
import { trpc } from '~/utils/trpc';

export default function VideosPage() {
  const { data: YoutubeVideos, isLoading } = useInfiniteQuery(
    trpc.youtube.data.infiniteQueryOptions(
      {
        limit: 10
      },
      {
        getNextPageParam: (lastpage) => lastpage.nextCursor
      }
    )
  );

  if (isLoading) {
    return <Loader />;
  }

  const videos = YoutubeVideos?.pages.flatMap((page) => page.videos) ?? [];

  if (videos.length === 0) {
    return <EmptyState text="No Videos" />;
  }

  const formatDuration = (d: string | null) =>
    d?.replace(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/, (_, h, m, s) =>
      h
        ? `${h}:${String(m || 0).padStart(2, '0')}:${String(s || 0).padStart(2, '0')}`
        : `${m || 0}:${String(s || 0).padStart(2, '0')}`
    ) ?? '';

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-4 sm:px-6">
      <div>
        <h1 className="text-lg font-bold sm:text-xl md:text-2xl">Your Videos</h1>
        <p className="text-muted-foreground md:text-md text-xs sm:text-sm">
          Select a video to view its AI analysis.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {videos.map((video) => (
          <Card
            key={video.id}
            className="group gap-0 overflow-hidden rounded-2xl border p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            {/* Thumbnail */}
            <div className="relative overflow-hidden">
              <Image
                src={`${video.thumbnailUrl}`}
                alt=""
                width={50}
                height={50}
                className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="fill-muted/60 text-muted/60 size-14 shrink-0" strokeWidth={2} />
              </div>

              <div className="text-muted/80 absolute right-2 bottom-2 flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{video.publishedAt?.toLocaleDateString()}</span>
                </div>

                <span className="bg-muted/80 h-1 w-1 rounded-full" />

                <Badge className="rounded bg-black/85 px-1.5 py-0.5 text-[11px] font-medium text-white hover:bg-black/85">
                  {formatDuration(video.duration)}
                </Badge>
              </div>
            </div>

            {/* Floating Info */}
            <div className="flex flex-col gap-3 p-5">
              <h2 className="line-clamp-2 text-lg leading-6 font-semibold">{video.title}</h2>

              <div className="flex items-center gap-4">
                <Stat
                  icon={<Eye className="h-4 w-4 text-blue-500" />}
                  label="Views"
                  value={`${video.viewCount}`}
                />

                <Stat
                  icon={<Heart className="h-4 w-4 text-red-500" />}
                  label="Likes"
                  value={`${video.likeCount}`}
                />

                <Stat
                  icon={<MessageCircle className="h-4 w-4 text-violet-500" />}
                  label="Comments"
                  value={`${video.commentCount}`}
                />
              </div>

              {/* Footer */}
              <div className="flex w-full flex-col-reverse justify-between gap-2 sm:flex-row sm:items-center">
                <p className="text-muted-foreground text-xs lg:text-sm">
                  {formatDistanceToNow(video.updatedAt, { addSuffix: true })}
                </p>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>

                  <Button size="sm">
                    View Analysis
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-1">
      {icon}
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
