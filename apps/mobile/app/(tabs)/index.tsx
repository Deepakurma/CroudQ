import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { InsightCarousel } from "@/components/dashboard/InsightCarousel";
import { OverviewGrid } from "@/components/dashboard/OverviewGrid";
import { SentimentCard } from "@/components/dashboard/SentimentCard";
import { LoadingState } from "@/components/LoadingState";
import { SCREEN_CONTENT_GAP } from "@/components/ui/AppScreen";
import { AccessGateState } from "@/components/ui/AccessGateState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TabScreen } from "@/components/ui/TabScreen";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { trpc } from "@/utils/api";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CircleAlert,
  Clock3,
  RefreshCw,
  Sparkles,
  Youtube,
} from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

type DashboardScreenState =
  | "upgrade_required"
  | "youtube_required"
  | "loading"
  | "error"
  | "not_enough_data"
  | "ready";

const formatDeletionDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

export default function DashboardScreen() {
  const { colors } = useAppTheme();
  const {
    cancelAccountDeletion,
    hasActiveSubscription,
    openUpgradePage,
    user,
    youtubeConnection,
    connectYouTube,
    syncYouTube,
    isYouTubeSyncing,
    isYouTubeSyncAvailable,
    youtubeLastSyncedLabel,
    selectedHomePlatform,
  } = useAuth();
  const [isCancelingDeletion, setIsCancelingDeletion] = React.useState(false);
  const tabBarHeight = useBottomTabBarHeight();
  const styles = getStyles(colors, tabBarHeight);
  const scheduledDeletionAt = user?.scheduledDeletionAt ?? null;
  const isEndedSubscription = user?.subscriptionState === "ended";
  const dashboardQuery = useQuery(
    trpc.insights.dashboard.queryOptions(undefined, {
      enabled: Boolean(
        user?.id && hasActiveSubscription && youtubeConnection.isConnected,
      ),
      retry: false,
    }),
  );
  const currentCommentCount = dashboardQuery.data?.currentCommentCount ?? 0;
  const screenState: DashboardScreenState = !hasActiveSubscription
    ? "upgrade_required"
    : !youtubeConnection.isConnected
      ? "youtube_required"
      : dashboardQuery.isLoading
        ? "loading"
        : dashboardQuery.isError
          ? "error"
        : currentCommentCount === 0
          ? "not_enough_data"
          : "ready";
  const shouldFillContent = screenState !== "ready";

  React.useEffect(() => {
    if (!dashboardQuery.error) {
      return;
    }

    Toast.show({
      type: "error",
      text1: "Dashboard",
      text2: "Could not load your latest AI dashboard insights.",
    });
  }, [dashboardQuery.error]);

  const handleCancelDeletion = async () => {
    setIsCancelingDeletion(true);

    try {
      await cancelAccountDeletion();
    } finally {
      setIsCancelingDeletion(false);
    }
  };

  const renderPrimaryContent = () => {
    switch (screenState) {
      case "upgrade_required":
        return (
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
        );
      case "youtube_required":
        return (
          <AccessGateState
            icon={Youtube}
            title="Connect YouTube"
            description="Connect your YouTube account to unlock your dashboard and performance insights."
            buttonText="Connect YouTube"
            onPress={() => void connectYouTube()}
          />
        );
      case "loading":
        return (
          <View style={styles.loadingState}>
            <LoadingState
              title="Building your dashboard"
              descriptions={[
                "Analyzing recent posts...",
                "Generating dashboard insights...",
                "Finding useful signals...",
              ]}
            />
          </View>
        );
      case "error":
        return (
          <AccessGateState
            icon={CircleAlert}
            title="Could not load dashboard"
            description="Please try again. Pull to refresh to retry."
          />
        );
      case "not_enough_data":
        return (
          <AccessGateState
            icon={CircleAlert}
            title="Not enough data yet"
            description="Not enough data is available to generate dashboard insights yet."
          />
        );
      case "ready":
        return (
          <>
            <View style={styles.section}>
              <SectionHeader
                title="What To Watch"
                subtitle="The clearest signals from your latest upload"
              />
              {dashboardQuery.data?.artifact ? (
                <InsightCarousel
                  cards={dashboardQuery.data.artifact.payload.insightCards}
                />
              ) : (
                <InsightCarousel />
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Overview"
                subtitle="How your latest upload compares to your previous one"
              />
              {dashboardQuery.data?.artifact ? (
                <OverviewGrid
                  stats={dashboardQuery.data.artifact.payload.overviewStats}
                />
              ) : (
                <OverviewGrid />
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Sentiment"
                subtitle="How people are reacting in your recent comments"
              />
              {dashboardQuery.data?.artifact ? (
                <SentimentCard
                  positivePercent={
                    dashboardQuery.data.artifact.payload.sentimentCard
                      .positivePercent
                  }
                  dominantTone={
                    dashboardQuery.data.artifact.payload.sentimentCard
                      .dominantTone
                  }
                  subtext={
                    dashboardQuery.data.artifact.payload.sentimentCard.subtext
                  }
                  split={
                    dashboardQuery.data.artifact.payload.sentimentCard.split
                  }
                />
              ) : (
                <SentimentCard />
              )}
            </View>

            <View style={styles.lastSyncedRow}>
              <View style={styles.lastSyncedLine} />
              <View style={styles.lastSyncedContent}>
                <Clock3 size={14} color={colors.textMuted} />
                <Text style={styles.lastSyncedText}>
                  Last synced {youtubeLastSyncedLabel}
                </Text>
              </View>
              <View style={styles.lastSyncedLine} />
            </View>
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      <TabScreen
        bottomContentOffset={40}
        refreshing={dashboardQuery.isRefetching}
        onRefresh={() => void Promise.all([dashboardQuery.refetch()])}
        contentContainerStyle={[
          shouldFillContent ? styles.fullHeightContent : null,
        ]}
      >
        <GreetingHeader selectedPlatform={selectedHomePlatform} />

        {hasActiveSubscription && scheduledDeletionAt ? (
          <View style={styles.deletionBanner}>
            <View style={styles.deletionBannerHeader}>
              <View style={styles.deletionIconWrap}>
                <AlertTriangle size={18} color={colors.error} />
              </View>
              <View style={styles.deletionCopy}>
                <Text style={styles.deletionTitle}>
                  Account scheduled for deletion
                </Text>
                <Text style={styles.deletionDescription}>
                  Your account will be permanently deleted on{" "}
                  {formatDeletionDate(scheduledDeletionAt)}.
                </Text>
              </View>
            </View>
            <Pressable
              style={[
                styles.cancelDeletionButton,
                isCancelingDeletion
                  ? styles.cancelDeletionButtonDisabled
                  : null,
              ]}
              onPress={() => void handleCancelDeletion()}
              disabled={isCancelingDeletion}
            >
              <Text style={styles.cancelDeletionButtonText}>
                {isCancelingDeletion ? "Canceling..." : "Cancel deletion"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {renderPrimaryContent()}
      </TabScreen>

      {hasActiveSubscription && youtubeConnection.isConnected ? (
        <View style={styles.syncWrap} pointerEvents="box-none">
          <Pressable
            style={[
              styles.syncButton,
              !isYouTubeSyncAvailable || isYouTubeSyncing
                ? styles.syncButtonDisabled
                : null,
            ]}
            onPress={() => void syncYouTube()}
            disabled={isYouTubeSyncing}
          >
            <RefreshCw
              size={16}
              color={
                !isYouTubeSyncAvailable || isYouTubeSyncing
                  ? colors.textSecondary
                  : colors.white
              }
            />
            <Text
              style={[
                styles.syncText,
                !isYouTubeSyncAvailable || isYouTubeSyncing
                  ? styles.syncTextDisabled
                  : null,
              ]}
            >
              {isYouTubeSyncing ? "Syncing..." : "Sync"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const getStyles = (colors: AppColors, tabBarHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    section: {
      gap: SCREEN_CONTENT_GAP,
    },
    deletionBanner: {
      gap: Spacing.m,
      padding: Spacing.l,
      borderRadius: 28,
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: `${colors.error}35`,
    },
    deletionBannerHeader: {
      flexDirection: "row",
      gap: Spacing.m,
    },
    deletionIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${colors.error}18`,
    },
    deletionCopy: {
      flex: 1,
    },
    deletionTitle: {
      color: colors.text,
      fontSize: Typography.size.l,
      fontFamily: Typography.font.bold,
    },
    deletionDescription: {
      color: colors.textSecondary,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.regular,
    },
    cancelDeletionButton: {
      alignSelf: "flex-start",
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.s,
      borderRadius: 999,
      backgroundColor: colors.error,
    },
    cancelDeletionButtonDisabled: {
      opacity: 0.7,
    },
    cancelDeletionButtonText: {
      color: colors.white,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
    },
    fullHeightContent: {
      flex: 1,
    },
    loadingState: {
      flex: 1,
      justifyContent: "center",
    },
    lastSyncedRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.s,
    },
    lastSyncedLine: {
      width: 35,
      height: 1,
      backgroundColor: colors.cardBorder,
    },
    lastSyncedContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    lastSyncedText: {
      color: colors.textMuted,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
    },
    syncWrap: {
      position: "absolute",
      right: Spacing.m,
      bottom: tabBarHeight + Spacing.m,
      alignItems: "flex-end",
    },
    syncButton: {
      minHeight: 44,
      paddingHorizontal: Spacing.l,
      paddingVertical: Spacing.s,
      backgroundColor: colors.primary,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      borderRadius: 999,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 18,
      elevation: 8,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    syncText: {
      color: colors.white,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
    },
    syncButtonDisabled: {
      backgroundColor: colors.cardSecondary,
      borderColor: colors.cardBorder,
      shadowOpacity: 0,
      elevation: 0,
      opacity: 0.78,
    },
    syncTextDisabled: {
      color: colors.textSecondary,
    },
  });
