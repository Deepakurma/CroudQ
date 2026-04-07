import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { AccessGateState } from "@/components/ui/AccessGateState";
import { SCREEN_SECTION_GAP } from "@/components/ui/AppScreen";
import { VideoListItem } from "@/components/videos/VideoListItem";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TabScreen } from "@/components/ui/TabScreen";
import { AppColors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { queryClient, trpc } from "@/utils/api";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useScrollToTop } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { PlayCircle, Sparkles, Youtube } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const VIDEOS_PAGE_SIZE = 10;

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

  const match = value.match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);

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
  const listRef = React.useRef<FlatList<SyncedVideo> | null>(null);
  const router = useRouter();
  const {
    connectYouTube,
    hasActiveSubscription,
    openUpgradePage,
    user,
    youtubeConnection,
  } = useAuth();
  const { colors } = useAppTheme();
  const refreshIndicatorColor =
    Platform.OS === "ios" ? colors.text : colors.primary;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = getStyles(colors, insets.top, tabBarHeight);
  const isEndedSubscription = user?.subscriptionState === "ended";
  const youtubeVideosQueryOptions = trpc.youtube.data.infiniteQueryOptions(
    { limit: VIDEOS_PAGE_SIZE },
    {
      enabled: Boolean(
        user?.id && hasActiveSubscription && youtubeConnection.isConnected,
      ),
      retry: false,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    },
  );
  const videosInfiniteQueryKey = youtubeVideosQueryOptions.queryKey;
  const youtubeVideosQuery = useInfiniteQuery(youtubeVideosQueryOptions);
  const videos: SyncedVideo[] =
    youtubeVideosQuery.data?.pages.flatMap((page) => page.videos) ?? [];
  const isLoading = youtubeVideosQuery.isLoading;
  const isRefreshing =
    youtubeVideosQuery.isRefetching && !youtubeVideosQuery.isFetchingNextPage;

  useScrollToTop(listRef);

  const handleRefresh = async () => {
    await queryClient.resetQueries({
      queryKey: videosInfiniteQueryKey,
      exact: true,
    });
  };

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

  const renderVideoItem = ({ item }: { item: SyncedVideo }) => (
    <VideoListItem
      title={item.title}
      duration={formatDuration(item.duration)}
      thumbnailUrl={item.thumbnailUrl}
      badgeLabel="Synced"
      badgeVariant="active"
      onPress={() =>
        router.push({
          pathname: "/videos/[id]" as never,
          params: {
            id: item.id,
            title: item.title,
            views: formatCompactNumber(item.viewCount),
            likes: formatCompactNumber(item.likeCount),
            duration: formatDuration(item.duration),
            thumbnailUrl: item.thumbnailUrl ?? undefined,
            sentiment: "active",
            sentimentLabel: "Synced",
            isUsedInDashboardAnalysis: item.isUsedInDashboardAnalysis
              ? "true"
              : "false",
          },
        })
      }
    />
  );

  if (
    hasActiveSubscription &&
    youtubeConnection.isConnected &&
    !isLoading &&
    videos.length > 0
  ) {
    return (
      <LinearGradient
        colors={colors.gradients.screen}
        style={styles.listScreen}
      >
        <FlatList
          ref={listRef}
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={renderVideoItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={refreshIndicatorColor}
              colors={[refreshIndicatorColor]}
              progressBackgroundColor={colors.card}
            />
          }
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (
              youtubeVideosQuery.hasNextPage &&
              !youtubeVideosQuery.isFetchingNextPage
            ) {
              void youtubeVideosQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <SectionHeader
                title="Videos"
                subtitle="See which videos are landing and where they lose people"
              />
            </View>
          }
          ListFooterComponent={
            youtubeVideosQuery.isFetchingNextPage ? (
              <View style={styles.listFooter}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
        />
      </LinearGradient>
    );
  }

  return (
    <TabScreen
      refreshing={isRefreshing}
      onRefresh={() => void handleRefresh()}
      contentContainerStyle={
        !hasActiveSubscription ||
        !youtubeConnection.isConnected ||
        isLoading ||
        videos.length === 0
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
    </TabScreen>
  );
}

const getStyles = (colors: AppColors, topInset: number, tabBarHeight: number) =>
  StyleSheet.create({
    listScreen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: topInset + 10,
    },
    listContent: {
      paddingHorizontal: 14,
      paddingBottom: tabBarHeight + 24,
    },
    listHeader: {
      marginBottom: SCREEN_SECTION_GAP,
    },
    listSeparator: {
      height: SCREEN_SECTION_GAP,
    },
    listFooter: {
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    fullHeightContent: {
      flex: 1,
    },
    loadingState: {
      flex: 1,
      justifyContent: "center",
    },
  });
