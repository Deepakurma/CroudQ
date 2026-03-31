import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/EmptyState";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { Activity } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface SentimentSegment {
  tone: "positive" | "neutral" | "negative";
  value: number;
}

interface SentimentCardProps {
  positivePercent?: number;
  dominantTone?: "positive" | "neutral" | "negative";
  subtext?: string;
  split?: readonly SentimentSegment[];
}

export function SentimentCard({
  positivePercent,
  dominantTone,
  subtext,
  split,
}: SentimentCardProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const resolvedSplit = split ?? [];

  if (resolvedSplit.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No sentiment signal yet"
        description="Comment mood will show once recent comments are analyzed."
      />
    );
  }

  const dominantSegment =
    resolvedSplit.reduce((highest, current) =>
      current.value > highest.value ? current : highest,
    ) ?? resolvedSplit[0];
  const resolvedDominantTone = dominantTone ?? dominantSegment.tone;

  const positiveSegment =
    resolvedSplit.find((segment) => segment.tone === "positive") ??
    resolvedSplit[0];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Comment mood</Text>
          <Text style={styles.score}>
            {(resolvedSplit.find((segment) => segment.tone === resolvedDominantTone)
              ?.value ??
              positivePercent ??
              positiveSegment.value)}
            % {getToneLabel(resolvedDominantTone).toLowerCase()}
          </Text>
        </View>

        <View style={styles.summaryPill}>
          <View
            style={[
              styles.summaryDot,
              { backgroundColor: getToneColor(colors, dominantSegment.tone) },
            ]}
          />
          <Text style={styles.summaryText}>
            {getToneLabel(resolvedDominantTone)}
          </Text>
        </View>
      </View>

      <Text style={styles.subtext}>
        {subtext ??
          `Most recent comments lean ${getToneLabel(resolvedDominantTone).toLowerCase()}.`}
      </Text>

      <View style={styles.barWrap}>
        <View style={styles.bar}>
          {resolvedSplit.map((segment, index) => (
            <View
              key={segment.tone}
              style={[
                styles.segment,
                {
                  backgroundColor: getToneColor(colors, segment.tone),
                  flex: segment.value,
                  borderTopLeftRadius: index === 0 ? 999 : 0,
                  borderBottomLeftRadius: index === 0 ? 999 : 0,
                  borderTopRightRadius:
                    index === resolvedSplit.length - 1 ? 999 : 0,
                  borderBottomRightRadius:
                    index === resolvedSplit.length - 1 ? 999 : 0,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.legend}>
        {resolvedSplit.map((segment) => (
          <View key={segment.tone} style={styles.legendItem}>
            <View style={styles.legendLeft}>
                <View
                  style={[
                    styles.legendSwatch,
                    { backgroundColor: getToneColor(colors, segment.tone) },
                  ]}
                />
              <View style={styles.legendCopy}>
                <Text style={styles.legendLabel}>
                  {getToneLabel(segment.tone)}
                </Text>
                <Text style={styles.legendHint}>Share of comments</Text>
              </View>
            </View>

            <Text style={styles.legendValue}>{segment.value}%</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const getToneLabel = (tone: SentimentSegment["tone"]) => {
  switch (tone) {
    case "positive":
      return "Positive";
    case "negative":
      return "Negative";
    default:
      return "Neutral";
  }
};

const getToneColor = (colors: AppColors, tone: SentimentSegment["tone"]) => {
  switch (tone) {
    case "positive":
      return colors.positive;
    case "negative":
      return colors.negative;
    default:
      return colors.neutral;
  }
};

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      gap: Spacing.xl,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: Spacing.m,
    },
    headerCopy: {
      flex: 1,
      gap:4,
    },
    eyebrow: {
      color: colors.textMuted,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    score: {
      color: colors.text,
      fontSize: Typography.size["3xl"],
      fontFamily: Typography.font.bold,
    },
    subtext: {
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.medium,
    },
    summaryPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.s,
      paddingHorizontal: Spacing.m,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
    },
    summaryText: {
      color: colors.text,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
    },
    barWrap: {
      gap: Spacing.s,
    },
    bar: {
      height: 18,
      borderRadius: 999,
      overflow: "hidden",
      flexDirection: "row",
      backgroundColor: colors.backgroundMuted,
    },
    segment: {
      height: "100%",
    },
    legend: {
      gap: Spacing.m,
    },
    legendItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: Spacing.m,
      paddingVertical: Spacing.s,
      paddingHorizontal: Spacing.m,
      borderRadius: 18,
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    legendLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.m,
    },
    legendSwatch: {
      width: 12,
      height: 36,
      borderRadius: 999,
    },
    legendCopy: {
      gap: 2,
    },
    legendLabel: {
      color: colors.text,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.semibold,
    },
    legendHint: {
      color: colors.textMuted,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
    },
    legendValue: {
      color: colors.text,
      fontSize: Typography.size.l,
      fontFamily: Typography.font.bold,
    },
  });
