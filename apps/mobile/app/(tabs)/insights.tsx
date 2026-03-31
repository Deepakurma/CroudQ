import { EmptyState } from "@/components/EmptyState";
import { InsightHeroCard } from "@/components/insights/InsightHeroCard";
import { NextContentMoveCard } from "@/components/insights/NextContentMoveCard";
import { StrategicInsightCard } from "@/components/insights/StrategicInsightCard";
import { LoadingState } from "@/components/LoadingState";
import { SCREEN_CONTENT_GAP } from "@/components/ui/AppScreen";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TabScreen } from "@/components/ui/TabScreen";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { trpc } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import { Rocket, TrendingUp, Wrench, Youtube } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

export default function InsightsScreen() {
  const { user, youtubeConnection } = useAuth();
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const strategyQuery = useQuery(
    trpc.insights.strategy.queryOptions(undefined, {
      enabled: Boolean(user?.id && youtubeConnection.isConnected),
      retry: false,
    }),
  );

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

  return (
    <TabScreen
      contentContainerStyle={
        !youtubeConnection.isConnected || strategyQuery.isLoading
          ? styles.fullHeightContent
          : undefined
      }
    >
      <View style={styles.section}>
        <SectionHeader
          title="Insights"
          subtitle="See what is working, what is not, and what to do next"
        />
        {!youtubeConnection.isConnected ? (
          <EmptyState
            icon={Youtube}
            title="Connect YouTube"
            description="Connect and sync to generate strategy insights."
          />
        ) : strategyQuery.isLoading ? null : strategyQuery.data ? (
          <InsightHeroCard
            title={strategyQuery.data.payload.topSignal.title}
            evidence={strategyQuery.data.payload.topSignal.evidence}
            actionHint={strategyQuery.data.payload.topSignal.actionHint}
            priority={strategyQuery.data.payload.topSignal.priority}
            evidenceLine={strategyQuery.data.payload.topSignal.evidenceLine}
          />
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No strategy insight yet"
            description="Strategy insights will appear after analysis is ready."
          />
        )}
      </View>

      {youtubeConnection.isConnected && strategyQuery.isLoading ? (
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

      {!strategyQuery.isLoading ? (
        <>
          <View style={styles.section}>
            <SectionHeader
              title="Recurring Friction"
              subtitle="What may be slowing your next post down"
            />
            {(strategyQuery.data?.payload.recurringFriction ?? []).length > 0 ? (
              <View style={styles.stack}>
                {(strategyQuery.data?.payload.recurringFriction ?? []).map((item) => (
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

          {strategyQuery.data ? (
            <View style={styles.section}>
              <NextContentMoveCard
                title={strategyQuery.data.payload.nextContentMove.title}
                steps={strategyQuery.data.payload.nextContentMove.steps}
                reasons={strategyQuery.data.payload.nextContentMove.reasons}
                tag={strategyQuery.data.payload.nextContentMove.tag}
                evidenceLine={strategyQuery.data.payload.nextContentMove.evidenceLine}
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
    loadingState: {
      flex: 1,
      justifyContent: "center",
    },
    stack: {
      gap: Spacing.l,
    },
  });
