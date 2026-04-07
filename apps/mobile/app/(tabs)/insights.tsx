import { EmptyState } from "@/components/EmptyState";
import { InsightHeroCard } from "@/components/insights/InsightHeroCard";
import { NextContentMoveCard } from "@/components/insights/NextContentMoveCard";
import { StrategicInsightCard } from "@/components/insights/StrategicInsightCard";
import { LoadingState } from "@/components/LoadingState";
import { SCREEN_CONTENT_GAP } from "@/components/ui/AppScreen";
import { AccessGateState } from "@/components/ui/AccessGateState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TabScreen } from "@/components/ui/TabScreen";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { trpc } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import {
  CircleAlert,
  Rocket,
  Sparkles,
  TrendingUp,
  Wrench,
  Youtube,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

type InsightsScreenState =
  | "upgrade_required"
  | "youtube_required"
  | "loading"
  | "error"
  | "not_enough_data"
  | "ready";

export default function InsightsScreen() {
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
  const strategyQuery = useQuery(
    trpc.insights.strategy.queryOptions(undefined, {
      enabled: Boolean(
        user?.id && hasActiveSubscription && youtubeConnection.isConnected,
      ),
      retry: false,
    }),
  );
  const currentCommentCount = strategyQuery.data?.currentCommentCount ?? 0;
  const screenState: InsightsScreenState = !hasActiveSubscription
    ? "upgrade_required"
    : !youtubeConnection.isConnected
      ? "youtube_required"
      : strategyQuery.isLoading
        ? "loading"
        : strategyQuery.isError
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
    if (!strategyQuery.error) {
      return;
    }

    Toast.show({
      type: "error",
      text1: "Insights",
      text2: "Could not load your latest strategy insights.",
    });
  }, [strategyQuery.error]);

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
            description="Connect and sync to generate strategy insights."
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
            title="Could not load insights"
            description="Please try again. Pull to refresh to retry."
          />
        );
      case "not_enough_data":
        return (
          <AccessGateState
            icon={CircleAlert}
            title="Not enough data yet"
            description="Not enough data is available to generate strategy insights yet."
          />
        );
      case "ready":
        return strategyQuery.data?.artifact ? (
          <InsightHeroCard
            title={strategyQuery.data.artifact.payload.topSignal.title}
            evidence={strategyQuery.data.artifact.payload.topSignal.evidence}
            actionHint={
              strategyQuery.data.artifact.payload.topSignal.actionHint
            }
            priority={strategyQuery.data.artifact.payload.topSignal.priority}
            evidenceLine={
              strategyQuery.data.artifact.payload.topSignal.evidenceLine
            }
          />
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No strategy insight yet"
            description="Strategy insights will appear after analysis is ready."
          />
        );
    }
  };

  return (
    <TabScreen
      refreshing={strategyQuery.isRefetching}
      onRefresh={() => void strategyQuery.refetch()}
      contentContainerStyle={
        screenState !== "ready" ? styles.fullHeightContent : undefined
      }
    >
      <View style={shouldFillTopSection ? styles.sectionFill : styles.section}>
        <SectionHeader
          title="Insights"
          subtitle="See what is working, what is not, and what to do next"
        />
        {renderPrimaryContent()}
      </View>

      {screenState === "loading" ? (
        <View style={styles.loadingState}>
          <LoadingState
            title="Generating strategy"
            descriptions={[
              "Reviewing recent performance...",
              "Spotting friction points...",
              "Building your next move...",
            ]}
          />
        </View>
      ) : null}

      {screenState === "ready" ? (
        <>
          <View style={styles.section}>
            <SectionHeader
              title="Recurring Friction"
              subtitle="What may be slowing your next post down"
            />
            {(strategyQuery.data?.artifact?.payload.recurringFriction ?? [])
              .length > 0 ? (
              <View style={styles.stack}>
                {(
                  strategyQuery.data?.artifact?.payload.recurringFriction ?? []
                ).map((item) => (
                  <StrategicInsightCard
                    key={item.id}
                    title={item.title}
                    contextLabel="Impact"
                    context={item.context}
                    tag={item.tag}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                icon={Wrench}
                title="No friction points yet"
                description="Friction will show once the analysis finds clear issues."
              />
            )}
          </View>

          {strategyQuery.data?.artifact ? (
            <View style={styles.section}>
              <NextContentMoveCard
                title={
                  strategyQuery.data.artifact.payload.nextContentMove.title
                }
                steps={
                  strategyQuery.data.artifact.payload.nextContentMove.steps
                }
                reasons={
                  strategyQuery.data.artifact.payload.nextContentMove.reasons
                }
                tag={strategyQuery.data.artifact.payload.nextContentMove.tag}
                evidenceLine={
                  strategyQuery.data.artifact.payload.nextContentMove
                    .evidenceLine
                }
              />
            </View>
          ) : (
            <View style={styles.section}>
              <EmptyState
                icon={Rocket}
                title="No next move yet"
                description="Your next content move will appear after analysis is ready."
              />
            </View>
          )}
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
      gap: SCREEN_CONTENT_GAP,
    },
    loadingState: {
      flex: 1,
      justifyContent: "center",
    },
    stack: {
      gap: Spacing.l,
    },
  });
