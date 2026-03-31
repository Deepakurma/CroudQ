import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { TrendingUp } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type InsightPriority = "High impact" | "Quick win" | "Needs fixing";

interface InsightHeroCardProps {
  title: string;
  evidence: readonly string[];
  actionHint: string;
  priority: InsightPriority;
  evidenceLine?: string;
}

export function InsightHeroCard({
  title,
  evidence,
  actionHint,
  priority,
  evidenceLine,
}: InsightHeroCardProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <Card style={styles.card}>
      <LinearGradient colors={colors.gradients.card} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.eyebrowRow}>
              <TrendingUp size={14} color={colors.secondary} />
              <Text style={styles.eyebrow}>Main takeaway</Text>
            </View>
            <Badge text={priority} variant={getBadgeVariant(priority)} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>

        {evidenceLine ? (
          <Text style={styles.evidenceLine}>{evidenceLine}</Text>
        ) : null}

        <View style={styles.evidenceList}>
          {evidence.map((item) => (
            <View key={item} style={styles.evidenceItem}>
              <View style={styles.evidenceDot} />
              <Text style={styles.evidenceText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionBox}>
          <Text style={styles.actionLabel}>What to do</Text>
          <Text style={styles.actionText}>{actionHint}</Text>
        </View>
      </LinearGradient>
    </Card>
  );
}

function getBadgeVariant(priority: InsightHeroCardProps["priority"]) {
  switch (priority) {
    case "Needs fixing":
      return "negative";
    case "Quick win":
      return "active";
    default:
      return "positive";
  }
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      padding: 0,
      overflow: "hidden",
    },
    gradient: {
      padding: Spacing.xl,
      gap: Spacing.l,
    },
    header: {
      gap: Spacing.m,
    },
    headerTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: Spacing.m,
    },
    headerCopy: {
      gap: 6,
    },
    eyebrowRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    eyebrow: {
      color: colors.secondary,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    title: {
      color: colors.text,
      fontSize: Typography.size["2xl"],
      fontFamily: Typography.font.bold,
    },
    evidenceLine: {
      color: colors.textMuted,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
    },
    evidenceList: {
      gap: Spacing.s,
    },
    evidenceItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.s,
    },
    evidenceDot: {
      width: 6,
      height: 6,
      borderRadius: 999,
      backgroundColor: colors.secondary,
      marginTop: 7,
    },
    evidenceText: {
      flex: 1,
      color: colors.text,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.medium,
    },
    actionBox: {
      gap: 4,
      padding: Spacing.m,
      borderRadius: 18,
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionLabel: {
      color: colors.textMuted,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    actionText: {
      color: colors.text,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.semibold,
    },
  });
