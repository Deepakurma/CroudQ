import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { AccessGateState } from "@/components/ui/AccessGateState";
import { VideoListItem } from "@/components/videos/VideoListItem";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TabScreen } from "@/components/ui/TabScreen";
import { AppColors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { trpc } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { PlayCircle, Sparkles, Youtube } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

type SyncedVideo = {
  id: string;
  youtubeVideoId: string;
  title: string;
  publishedAt: Date | null;
  thumbnailUrl: string | null;
  viewCount: number | null;
  likeCount: number | null;
  favoriteCount: number | null;
  commentCount: number | null;
  duration: string | null;
  isUsedInDashboardAnalysis: boolean;
};

const formatCompactNumber = (value: number | null) => {
  if (!value || value < 1) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

const formatDuration = (value: string | null) => {
  if (!value) {
    return "--:--";
  }

  const match = value.match(
    /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/,
  );

  if (!match) {
    return value;
  }

  const [, days, hours, minutes, seconds] = match;
  const totalHours = Number(days || 0) * 24 + Number(hours || 0);
  const totalMinutes = Number(minutes || 0);
  const totalSeconds = Number(seconds || 0);

  if (totalHours > 0) {
    return `${totalHours}:${String(totalMinutes).padStart(2, "0")}:${String(
      totalSeconds,
    ).padStart(2, "0")}`;
  }

  return `${totalMinutes}:${String(totalSeconds).padStart(2, "0")}`;
};

export default function VideosScreen() {
  const router = useRouter();
  const {
    connectYouTube,
    hasActiveSubscription,
    openUpgradePage,
    user,
    youtubeConnection,
  } = useAuth();
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const isEndedSubscription = user?.subscriptionState === "ended";
  const youtubeVideosQuery = useQuery(
    trpc.youtube.data.queryOptions(
      {},
      {
        enabled: Boolean(
          user?.id && hasActiveSubscription && youtubeConnection.isConnected,
        ),
        retry: false,
      },
    ),
  );
  const videos: SyncedVideo[] = youtubeVideosQuery.data?.videos ?? [];
  const isLoading = youtubeVideosQuery.isLoading;

  React.useEffect(() => {
    if (!youtubeVideosQuery.error) {
      return;
    }

    Toast.show({
      type: "error",
      text1: "Videos",
      text2: "Could not load your latest synced videos.",
    });
  }, [youtubeVideosQuery.error]);

  return (
    <TabScreen
      contentContainerStyle={
        !hasActiveSubscription || !youtubeConnection.isConnected || isLoading
          ? styles.fullHeightContent
          : undefined
      }
    >
      <SectionHeader
        title="Videos"
        subtitle="See which videos are landing and where they lose people"
      />

      {!hasActiveSubscription ? (
        <AccessGateState
          icon={Sparkles}
          title={
            isEndedSubscription
              ? "Your Subscription has ended"
              : "Subscribe to CroudQ Pro"
          }
          description={
            isEndedSubscription
              ? "Renew your plan and you're good to go again."
              : "Subscribe to get access to your dashboard and performance insights."
          }
          buttonText={isEndedSubscription ? "Renew plan" : "Subscribe now"}
          onPress={() => void openUpgradePage()}
        />
      ) : youtubeConnection.isConnected && isLoading ? (
        <View style={styles.loadingState}>
          <LoadingState
            title="Loading videos"
            descriptions={[
              "Pulling your latest uploads...",
              "Checking synced video data...",
              "Preparing video insights...",
            ]}
          />
        </View>
      ) : null}

      {hasActiveSubscription && !youtubeConnection.isConnected ? (
        <AccessGateState
          icon={Youtube}
          title="Connect YouTube"
          description="Connect and sync to see your videos here."
          buttonText="Connect YouTube"
          onPress={() => void connectYouTube()}
        />
      ) : hasActiveSubscription && !isLoading && videos.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title="No videos yet"
          description="Your latest synced videos will appear here."
        />
      ) : null}

      {videos.map((video) => (
        <VideoListItem
          key={video.id}
          title={video.title}
          views={formatCompactNumber(video.viewCount)}
          secondaryStatLabel="Likes"
          secondaryStatValue={formatCompactNumber(video.likeCount)}
          duration={formatDuration(video.duration)}
          thumbnailUrl={video.thumbnailUrl}
          badgeLabel="Synced"
          badgeVariant="active"
          onPress={() =>
            router.push({
              pathname: "/videos/[id]" as never,
              params: {
                id: video.id,
                title: video.title,
                views: formatCompactNumber(video.viewCount),
                engagement: formatCompactNumber(video.likeCount),
                duration: formatDuration(video.duration),
                thumbnailUrl: video.thumbnailUrl ?? undefined,
                sentiment: "active",
                sentimentLabel: "Synced",
                isUsedInDashboardAnalysis: video.isUsedInDashboardAnalysis
                  ? "true"
                  : "false",
              },
            })
          }
        />
      ))}
    </TabScreen>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    fullHeightContent: {
      flex: 1,
    },
    loadingState: {
      flex: 1,
      justifyContent: "center",
    },
  });
