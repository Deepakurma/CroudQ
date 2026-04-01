import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/EmptyState";
import { AppColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { LayoutGrid } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface OverviewStat {
  id: string;
  label: string;
  value: string;
  delta: string;
}

interface OverviewGridProps {
  stats?: readonly OverviewStat[];
}

export function OverviewGrid({ stats }: OverviewGridProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const statOrder = [
    "total_views",
    "engagement_rate",
    "total_likes",
    "total_comments",
  ];
  const resolvedStats = [...(stats ?? [])].sort((left, right) => {
    const leftIndex = statOrder.indexOf(left.id);
    const rightIndex = statOrder.indexOf(right.id);

    return (
      (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
      (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex)
    );
  });

  if (resolvedStats.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="No overview metrics yet"
        description="Overview metrics will appear after more sync data is available."
      />
    );
  }

  return (
    <View style={styles.grid}>
      {resolvedStats.map((stat) => (
        <Card key={stat.id} style={styles.card}>
          <Text style={styles.label}>{stat.label}</Text>
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.delta}>{stat.delta}</Text>
        </Card>
      ))}
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 12,
    rowGap: 12,
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    gap: 8,
  },
  label: {
    color: colors.textSecondary,
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
  },
  value: {
    color: colors.text,
    fontSize: Typography.size["3xl"],
    fontFamily: Typography.font.bold,
  },
  delta: {
    color: colors.secondary,
    fontSize: Typography.size.s,
    fontFamily: Typography.font.semibold,
  },
  });
