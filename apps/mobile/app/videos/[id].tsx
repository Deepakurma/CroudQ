import { CommentClusterList } from "@/components/dashboard/CommentClusterList";
import { SuggestionList } from "@/components/dashboard/SuggestionList";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { AppScreen, SCREEN_CONTENT_GAP } from "@/components/ui/AppScreen";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AppColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { queryClient, trpc } from "@/utils/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  PlayCircle,
  RefreshCw,
  Youtube,
} from "lucide-react-native";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Spacing } from "@/constants/Spacing";

type SentimentTone = "positive" | "neutral" | "negative" | "unavailable";

const getSentimentLabel = (tone: SentimentTone) => {
  switch (tone) {
    case "positive":
      return "Positive";
    case "negative":
      return "Negative";
    case "unavailable":
      return "Unavailable";
    default:
      return "Neutral";
  }
};

const getSentimentColor = (colors: AppColors, tone: SentimentTone) => {
  switch (tone) {
    case "positive":
      return colors.positive;
    case "negative":
      return colors.negative;
    case "unavailable":
      return colors.textMuted;
    default:
      return colors.neutral;
  }
};

export default function VideoDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    views?: string;
    engagement?: string;
    duration?: string;
    thumbnailUrl?: string;
    sentiment?: "positive" | "negative" | "active";
    sentimentLabel?: string;
  }>();
  const rawVideoId = params.id;
  const videoId =
    typeof rawVideoId === "string"
      ? rawVideoId
      : Array.isArray(rawVideoId)
        ? (rawVideoId[0] ?? "")
        : "";
  const router = useRouter();
  const { user, youtubeConnection } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets.bottom);
  const videoQuery = useQuery(
    trpc.insights.video.queryOptions(
      { videoId },
      {
        enabled: Boolean(videoId && user?.id && youtubeConnection.isConnected),
        retry: false,
      },
    ),
  );
  const generateVideoInsight = useMutation(
    trpc.insights.refreshVideo.mutationOptions({
      onSuccess: async (result) => {
        if (result.action === "skipped") {
          Toast.show({
            type: "info",
            text1: "Video Insight",
            text2: "No significant change noticed to regenerate.",
          });
          return;
        }

        await queryClient.invalidateQueries({
          queryKey: trpc.insights.video.queryOptions({ videoId }).queryKey,
        });
      },
      onError: () => {
        Toast.show({
          type: "error",
          text1: "Video Insight",
          text2: "Could not generate this video's AI breakdown.",
        });
      },
    }),
  );

  React.useEffect(() => {
    if (!videoQuery.error) {
      return;
    }

    Toast.show({
      type: "error",
      text1: "Video Insight",
      text2: "Could not load this video's AI breakdown.",
    });
  }, [videoQuery.error]);

  const thumbnailUrl = params.thumbnailUrl;
  const durationLabel = params.duration ?? "--:--";
  const videoInsight = videoQuery.data?.artifact?.payload;
  const hasAnalysis = videoQuery.data?.hasAnalysis ?? false;
  const isGenerating = generateVideoInsight.isPending;
  const dominantVideoSentiment =
    videoInsight?.sentimentSummary.dominantTone ??
    videoInsight?.sentimentSummary.split.reduce((highest, current) =>
      current.value > highest.value ? current : highest,
    )?.tone;
  const hasVideoSentimentSignal = Boolean(
    videoInsight?.sentimentSummary.split.some((item) => item.value > 0),
  );

  return (
    <AppScreen>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <ChevronLeft size={24} color={colors.text} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Card style={styles.heroCard}>
        <View style={styles.thumbnail}>
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={colors.gradients.card}
              style={styles.thumbnailFallback}
            >
              <PlayCircle size={34} color={colors.text} />
            </LinearGradient>
          )}
          <View style={styles.durationPill}>
            <Text style={styles.duration}>{durationLabel}</Text>
          </View>
        </View>
        <View style={styles.heroCopy}>
          <Badge
            text={params.sentimentLabel ?? "AI"}
            variant={params.sentiment ?? "active"}
          />
          <Text style={styles.title}>{params.title ?? "Video insight"}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {params.views ?? "--"} views . {params.engagement ?? "--"}{" "}
              engagement
            </Text>
            {youtubeConnection.isConnected && hasAnalysis ? (
              <Pressable
                style={[
                  styles.regenerateInlineButton,
                  isGenerating ? styles.generateButtonDisabled : null,
                ]}
                onPress={() => {
                  void generateVideoInsight.mutateAsync({ videoId });
                }}
                disabled={isGenerating || !videoId}
              >
                <RefreshCw
                  size={14}
                  color={isGenerating ? colors.textSecondary : colors.white}
                />
                <Text
                  style={[
                    styles.regenerateInlineText,
                    isGenerating ? styles.generateTextDisabled : null,
                  ]}
                >
                  {isGenerating ? "Generating..." : "Regenerate"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Card>

      {!youtubeConnection.isConnected ? (
        <EmptyState
          icon={Youtube}
          title="Connect YouTube"
          description="Connect and sync to generate this video insight."
        />
      ) : videoQuery.isLoading || (isGenerating && !hasAnalysis) ? (
        <LoadingState
          title="Generating video insight"
          descriptions={[
            "Analyzing this video's comments...",
            "Looking for performance patterns...",
            "Generating video-specific feedback...",
          ]}
        />
      ) : videoInsight ? (
        <>
          <View style={styles.section}>
            <SectionHeader
              title="Comment Mood"
              subtitle="How people felt in the comments on this video"
            />
            <Card style={styles.sentimentCard}>
              <View style={styles.sentimentHeader}>
                <View>
                  <Text style={styles.sentimentValue}>
                    {getSentimentLabel(dominantVideoSentiment ?? "neutral")}
                  </Text>
                  <Text style={styles.sentimentText}>
                    {videoInsight.sentimentSummary.copy}
                  </Text>
                </View>
              </View>

              <View style={styles.sentimentBar}>
                {hasVideoSentimentSignal ? (
                  videoInsight.sentimentSummary.split.map((item, index) => (
                    <View
                      key={item.tone}
                      style={[
                        styles.sentimentSegment,
                        {
                          flex: item.value,
                          backgroundColor: getSentimentColor(colors, item.tone),
                          borderTopLeftRadius: index === 0 ? 999 : 0,
                          borderBottomLeftRadius: index === 0 ? 999 : 0,
                          borderTopRightRadius:
                            index ===
                            videoInsight.sentimentSummary.split.length - 1
                              ? 999
                              : 0,
                          borderBottomRightRadius:
                            index ===
                            videoInsight.sentimentSummary.split.length - 1
                              ? 999
                              : 0,
                        },
                      ]}
                    />
                  ))
                ) : (
                  <View
                    style={[
                      styles.sentimentSegment,
                      {
                        flex: 1,
                        backgroundColor: getSentimentColor(
                          colors,
                          "unavailable",
                        ),
                        borderRadius: 999,
                      },
                    ]}
                  />
                )}
              </View>

              <View style={styles.sentimentLegend}>
                {videoInsight.sentimentSummary.split.map((item) => (
                  <View key={item.tone} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: getSentimentColor(colors, item.tone) },
                      ]}
                    />
                    <Text style={styles.legendLabel}>
                      {getSentimentLabel(item.tone)} {item.value}%
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="What People Said"
              subtitle="The main themes showing up in the comments"
            />
            <CommentClusterList clusters={videoInsight.commentClusters} />
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="AI Suggestions"
              subtitle="Helpful next steps based on how this video performed"
            />
            <SuggestionList items={videoInsight.aiSuggestions} />
          </View>
        </>
      ) : (
        <View style={styles.emptyStateWrap}>
          <EmptyState
            icon={PlayCircle}
            title="No video insight yet"
            description="Tap Generate to create analysis for this video."
          />
          <Pressable
            style={[
              styles.generateButton,
              isGenerating ? styles.generateButtonDisabled : null,
            ]}
            onPress={() => {
              void generateVideoInsight.mutateAsync({ videoId });
            }}
            disabled={isGenerating || !videoId}
          >
            <Text
              style={[
                styles.generateText,
                isGenerating ? styles.generateTextDisabled : null,
              ]}
            >
              {isGenerating ? "Generating..." : "Generate"}
            </Text>
          </Pressable>
        </View>
      )}
    </AppScreen>
  );
}

const getStyles = (colors: AppColors, bottomInset: number) =>
  StyleSheet.create({
    back: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    backText: {
      color: colors.textSecondary,
      fontSize: Typography.size["2xl"],
      fontFamily: Typography.font.semibold,
    },
    heroCard: {
      gap: 16,
    },
    section: {
      gap: SCREEN_CONTENT_GAP,
    },
    thumbnail: {
      height: 210,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    thumbnailImage: {
      width: "100%",
      height: "100%",
    },
    thumbnailFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    durationPill: {
      position: "absolute",
      left: 16,
      bottom: 16,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.overlay,
    },
    duration: {
      color: colors.white,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
    },
    heroCopy: {
      gap: 10,
    },
    title: {
      color: colors.text,
      fontSize: Typography.size["3xl"],
      fontFamily: Typography.font.bold,
    },
    meta: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.medium,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.m,
    },
    sentimentCard: {
      gap: 16,
    },
    sentimentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    sentimentValue: {
      color: colors.text,
      fontSize: Typography.size["2xl"],
      fontFamily: Typography.font.bold,
    },
    sentimentText: {
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
      marginTop: 4,
    },
    sentimentBar: {
      height: 16,
      borderRadius: 999,
      overflow: "hidden",
      flexDirection: "row",
      backgroundColor: colors.backgroundMuted,
    },
    sentimentSegment: {
      height: "100%",
    },
    sentimentLegend: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
    },
    legendLabel: {
      color: colors.textMuted,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
    },
    emptyStateWrap: {
      alignItems: "center",
    },
    generateButton: {
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
    generateText: {
      color: colors.white,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.semibold,
    },
    generateButtonDisabled: {
      backgroundColor: colors.cardSecondary,
      borderColor: colors.cardBorder,
      shadowOpacity: 0,
      elevation: 0,
      opacity: 0.78,
    },
    generateTextDisabled: {
      color: colors.textSecondary,
    },
    regenerateInlineButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.xs,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: "center",
      flexShrink: 0,
    },
    regenerateInlineText: {
      color: colors.white,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
    },
  });
