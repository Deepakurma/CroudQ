import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { InsightCarousel } from "@/components/dashboard/InsightCarousel";
import { OverviewGrid } from "@/components/dashboard/OverviewGrid";
import { SentimentCard } from "@/components/dashboard/SentimentCard";
import { SuggestionList } from "@/components/dashboard/SuggestionList";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { SCREEN_CONTENT_GAP } from "@/components/ui/AppScreen";
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
import { AlertTriangle, Clock3, RefreshCw, Youtube } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

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
  const dashboardQuery = useQuery(
    trpc.insights.dashboard.queryOptions(undefined, {
      enabled: Boolean(user?.id && youtubeConnection.isConnected),
      retry: false,
    }),
  );

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

  return (
    <View style={styles.container}>
      <TabScreen
        bottomContentOffset={40}
        contentContainerStyle={[
          !youtubeConnection.isConnected || dashboardQuery.isLoading
            ? styles.fullHeightContent
            : null,
        ]}
      >
        <GreetingHeader selectedPlatform={selectedHomePlatform} />

        {scheduledDeletionAt ? (
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

        {!youtubeConnection.isConnected ? (
          <View style={styles.disconnectedState}>
            <EmptyState
              icon={Youtube}
              title="Connect YouTube"
              description="Connect your YouTube account to unlock dashboard, videos insights, and comments analysis."
              style={styles.disconnectedEmptyState}
            />
            <Pressable
              style={styles.connectButton}
              onPress={() => void connectYouTube()}
            >
              <Text style={styles.connectButtonText}>Connect YouTube</Text>
            </Pressable>
          </View>
        ) : dashboardQuery.isLoading ? (
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
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeader
                title="What To Watch"
                subtitle="The clearest signals from your latest posts"
              />
              {dashboardQuery.data ? (
                <InsightCarousel
                  cards={dashboardQuery.data.payload.insightCards}
                />
              ) : (
                <InsightCarousel />
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Overview"
                subtitle="A quick look at how your content is doing"
              />
              {dashboardQuery.data ? (
                <OverviewGrid
                  stats={dashboardQuery.data.payload.overviewStats}
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
              {dashboardQuery.data ? (
                <SentimentCard
                  positivePercent={
                    dashboardQuery.data.payload.sentimentCard.positivePercent
                  }
                  dominantTone={
                    dashboardQuery.data.payload.sentimentCard.dominantTone
                  }
                  subtext={dashboardQuery.data.payload.sentimentCard.subtext}
                  split={dashboardQuery.data.payload.sentimentCard.split}
                />
              ) : (
                <SentimentCard />
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="What To Try Next"
                subtitle="Simple moves that could help your next post"
              />
              {dashboardQuery.data ? (
                <SuggestionList
                  items={dashboardQuery.data.payload.suggestions}
                />
              ) : (
                <SuggestionList />
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
        )}
      </TabScreen>

      {youtubeConnection.isConnected ? (
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
    disconnectedState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: 50,
    },
    loadingState: {
      flex: 1,
      justifyContent: "center",
    },
    disconnectedEmptyState: {
      flexGrow: 0,
      justifyContent: "center",
      width: "100%",
    },
    connectButton: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.m,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 18,
      elevation: 8,
    },
    connectButtonText: {
      color: colors.white,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.semibold,
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
