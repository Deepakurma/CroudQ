import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
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
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import {
  CircleAlert,
  Lightbulb,
  MessageSquareMore,
  Sparkles,
  TriangleAlert,
  Youtube,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

type CommentsScreenState =
  | "upgrade_required"
  | "youtube_required"
  | "loading"
  | "error"
  | "not_enough_data"
  | "ready";

export default function CommentsScreen() {
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
  const isCreatedSubscription = user?.subscriptionState === "created";
  const commentsQuery = useQuery(
    trpc.insights.comments.queryOptions(undefined, {
      enabled: Boolean(
        user?.id && hasActiveSubscription && youtubeConnection.isConnected,
      ),
      retry: false,
    }),
  );
  const currentCommentCount = commentsQuery.data?.currentCommentCount ?? 0;
  const screenState: CommentsScreenState = !hasActiveSubscription
    ? "upgrade_required"
    : !youtubeConnection.isConnected
      ? "youtube_required"
      : commentsQuery.isLoading
        ? "loading"
        : commentsQuery.isError
          ? "error"
          : currentCommentCount === 0
            ? "not_enough_data"
            : "ready";
  const shouldFillTopSection =
    screenState === "upgrade_required" ||
    screenState === "youtube_required" ||
    screenState === "error" ||
    screenState === "not_enough_data";

  React.useEffect(() => {
    if (!commentsQuery.error) {
      return;
    }

    Toast.show({
      type: "error",
      text1: "Comments",
      text2: "Could not load your AI comment insights.",
    });
  }, [commentsQuery.error]);

  const insights = commentsQuery.data?.artifact?.payload;

  const renderPrimaryContent = () => {
    switch (screenState) {
      case "upgrade_required":
        return (
          <AccessGateState
            icon={Sparkles}
            title={
              isCreatedSubscription
                ? "Complete your subscription"
                : isEndedSubscription
                ? "Your Subscription has ended"
                : "Subscribe to CroudQ Pro"
            }
            description={
              isCreatedSubscription
                ? "Subscribe and you're good to go."
                : isEndedSubscription
                ? "Renew your plan and you're good to go again."
                : "Subscribe to get access to your dashboard and performance insights."
            }
            buttonText={
              isCreatedSubscription
                ? "Complete"
                : isEndedSubscription
                  ? "Renew plan"
                  : "Subscribe now"
            }
            onPress={() => void openUpgradePage()}
          />
        );
      case "youtube_required":
        return (
          <AccessGateState
            icon={Youtube}
            title="Connect YouTube"
            description="Connect and sync to generate comment insights."
            buttonText="Connect YouTube"
            onPress={() => void connectYouTube()}
          />
        );
      case "loading":
        return null;
      case "error":
        return (
          <AccessGateState
            icon={CircleAlert}
            title="Could not load comments"
            description="Please try again. Pull to refresh to retry."
          />
        );
      case "not_enough_data":
        return (
          <AccessGateState
            icon={CircleAlert}
            title="Not enough data yet"
            description="Not enough data is available to generate insights yet."
          />
        );
      case "ready":
        return insights ? (
          <Card style={styles.pulseCard}>
            <LinearGradient
              colors={colors.gradients.card}
              style={styles.pulseGradient}
            >
              <View style={styles.pulseHeader}>
                <View style={styles.pulseIconWrap}>
                  <Lightbulb size={18} color={colors.secondary} />
                </View>
                <Badge text="AI summary" variant="active" />
              </View>
              <Text style={styles.pulseTitle}>Comment pulse</Text>
              <Text style={styles.pulseText}>{insights.pulse}</Text>
            </LinearGradient>
          </Card>
        ) : (
          <EmptyState
            icon={Lightbulb}
            title="No comment pulse yet"
            description="Comment insights will appear after analysis is ready."
          />
        );
    }
  };

  return (
    <TabScreen
      refreshing={commentsQuery.isRefetching}
      onRefresh={() => void commentsQuery.refetch()}
      contentContainerStyle={
        screenState !== "ready" ? styles.fullHeightContent : undefined
      }
    >
      <View
        style={[styles.section, shouldFillTopSection && styles.sectionFill]}
      >
        <SectionHeader
          title="Comments"
          subtitle="Hear your audience clearly and spot what matters"
        />
        {renderPrimaryContent()}
      </View>

      {screenState === "loading" ? (
        <View style={styles.loadingState}>
          <LoadingState
            title="Analyzing comments"
            descriptions={[
              "Reading recent comments...",
              "Grouping audience themes...",
              "Generating comment insights...",
            ]}
          />
        </View>
      ) : null}

      {screenState === "ready" ? (
        <>
          <View style={styles.section}>
            <SectionHeader
              title="Top Themes"
              subtitle="What people keep bringing up most"
            />
            {(insights?.topThemes ?? []).length > 0 ? (
              <View style={styles.stack}>
                {(insights?.topThemes ?? []).map((theme) => (
                  <Card key={theme.id} style={styles.themeCard}>
                    <View style={styles.themeHeader}>
                      <View style={styles.themeTopRow}>
                        <View style={styles.themeIconWrap}>
                          <MessageSquareMore size={16} color={colors.text} />
                        </View>
                        <Text style={styles.themeTitle}>{theme.title}</Text>
                      </View>
                      <View style={styles.themeBadgeWrap}>
                        <Badge
                          text={`${theme.count} comments`}
                          variant="default"
                        />
                      </View>
                    </View>
                    <View style={styles.quoteList}>
                      {theme.quotes.map((quote) => (
                        <Text key={quote} style={styles.quoteText}>
                          &quot;{quote}&quot;
                        </Text>
                      ))}
                    </View>
                  </Card>
                ))}
              </View>
            ) : (
              <EmptyState
                icon={MessageSquareMore}
                title="No themes yet"
                description="Themes will appear once more comments are available."
              />
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Needs Attention"
              subtitle="The issues worth responding to first"
            />
            {insights && insights.needsAttention.length > 0 ? (
              <Card style={styles.attentionCard}>
                {insights.needsAttention.map((theme) => (
                  <View key={theme.id} style={styles.attentionRow}>
                    <View style={styles.attentionCopy}>
                      <View style={styles.attentionIconWrap}>
                        <TriangleAlert size={16} color={colors.negative} />
                      </View>
                      <Text style={styles.attentionTitle}>{theme.title}</Text>
                    </View>

                    <Text style={styles.attentionText}>
                      {theme.implication}
                    </Text>
                  </View>
                ))}
              </Card>
            ) : (
              <Card style={styles.calmCard}>
                <Text style={styles.calmTitle}>
                  Nothing urgent is standing out.
                </Text>
                <Text style={styles.calmText}>
                  The current comments do not show a strong negative pattern
                  right now.
                </Text>
              </Card>
            )}
          </View>
        </>
      ) : null}
    </TabScreen>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    fullHeightContent: {
      flex: 1,
    },
    section: {
      gap: SCREEN_CONTENT_GAP,
    },
    sectionFill: {
      flex: 1,
    },
    loadingState: {
      flex: 1,
      justifyContent: "center",
    },
    stack: {
      gap: Spacing.l,
    },
    pulseCard: {
      padding: 0,
      overflow: "hidden",
    },
    pulseGradient: {
      gap: Spacing.l,
      padding: Spacing.xl,
    },
    pulseHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: Spacing.m,
    },
    pulseIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pulseTitle: {
      color: colors.text,
      fontSize: Typography.size.xl,
      fontFamily: Typography.font.bold,
    },
    pulseText: {
      color: colors.textSecondary,
      fontSize: Typography.size.l,
      fontFamily: Typography.font.medium,
    },
    themeCard: {
      gap: Spacing.m,
      backgroundColor: colors.backgroundElevated,
    },
    themeHeader: {
      gap: Spacing.s,
    },
    themeTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.m,
    },
    themeIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      flexShrink: 0,
    },
    themeTitle: {
      flexShrink: 1,
      color: colors.text,
      fontSize: Typography.size.l,
      fontFamily: Typography.font.bold,
      lineHeight: Typography.size.l * 1.25,
    },
    themeBadgeWrap: {
      // alignSelf: "center",
      marginLeft: 50,
    },
    quoteList: {
      gap: 8,
    },
    quoteText: {
      flexShrink: 1,
      color: colors.textMuted,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
    },
    attentionCard: {
      gap: Spacing.l,
      backgroundColor: colors.backgroundElevated,
    },
    attentionRow: {
      width: "100%",
      alignItems: "flex-start",
      gap: Spacing.s,
    },
    attentionIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    attentionCopy: {
      width: "100%",
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.m,
    },
    attentionTitle: {
      flex: 1,
      minWidth: 0,
      flexShrink: 1,
      color: colors.text,
      fontSize: Typography.size.l,
      fontFamily: Typography.font.semibold,
    },
    attentionText: {
      width: "100%",
      flexShrink: 1,
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
    },
    calmCard: {
      gap: 8,
      backgroundColor: colors.backgroundElevated,
    },
    calmTitle: {
      color: colors.text,
      fontSize: Typography.size.l,
      fontFamily: Typography.font.bold,
    },
    calmText: {
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
    },
  });
