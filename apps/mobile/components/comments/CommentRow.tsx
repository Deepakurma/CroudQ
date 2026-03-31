import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AppColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface CommentRowProps {
  text: string;
  sentiment: "positive" | "negative" | "neutral";
  cluster: string;
}

export function CommentRow({ text, sentiment, cluster }: CommentRowProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.meta}>
          <Badge text={sentiment} variant={sentiment} />
          <View style={styles.clusterPill}>
            <Text style={styles.cluster}>{cluster}</Text>
          </View>
        </View>
        <Text style={styles.label}>Comment</Text>
      </View>
      <Text style={styles.comment}>{text}</Text>
    </Card>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
  },
  clusterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cluster: {
    color: colors.textSecondary,
    fontSize: Typography.size.s,
    fontFamily: Typography.font.semibold,
    textTransform: "capitalize",
  },
  label: {
    color: colors.textMuted,
    fontSize: Typography.size.s,
    fontFamily: Typography.font.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  comment: {
    color: colors.text,
    fontSize: Typography.size.l,
    fontFamily: Typography.font.medium,
    lineHeight: Typography.lineHeight.l,
  },
  });
