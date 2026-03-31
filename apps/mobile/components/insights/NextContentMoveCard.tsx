import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { Lightbulb, ListChecks, Rocket } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type InsightPriority = "High impact" | "Quick win" | "Needs fixing";

interface NextContentMoveCardProps {
  title: string;
  steps: readonly string[];
  reasons: readonly string[];
  tag: InsightPriority;
  evidenceLine?: string;
}

export function NextContentMoveCard({
  title,
  steps,
  reasons,
  tag,
  evidenceLine,
}: NextContentMoveCardProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <Card style={styles.card}>
      <LinearGradient colors={colors.gradients.card} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.eyebrowRow}>
              <Rocket size={14} color={colors.secondary} />
              <Text style={styles.eyebrow}>Post this next</Text>
            </View>
            <Badge text={tag} variant={getBadgeVariant(tag)} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>

        {evidenceLine ? (
          <Text style={styles.evidenceLine}>{evidenceLine}</Text>
        ) : null}

        <View style={styles.block}>
          <View style={styles.labelRow}>
            <ListChecks size={14} color={colors.textMuted} />
            <Text style={styles.label}>How to make it</Text>
          </View>
          <View style={styles.list}>
            {steps.map((step, index) => (
              <View key={step} style={styles.listItem}>
                <View style={styles.indexPill}>
                  <Text style={styles.indexText}>{index + 1}</Text>
                </View>
                <Text style={styles.listText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.block}>
          <View style={styles.labelRow}>
            <Lightbulb size={14} color={colors.textMuted} />
            <Text style={styles.label}>Why this fits</Text>
          </View>
          <View style={styles.list}>
            {reasons.map((reason) => (
              <View key={reason} style={styles.reasonItem}>
                <View style={styles.reasonDot} />
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </Card>
  );
}

function getBadgeVariant(tag: NextContentMoveCardProps["tag"]) {
  switch (tag) {
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
    copy: {
      flex: 1,
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
    block: {
      gap: Spacing.m,
    },
    evidenceLine: {
      color: colors.textMuted,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
    },
    label: {
      color: colors.textMuted,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    list: {
      gap: Spacing.m,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.m,
    },
    indexPill: {
      width: 24,
      height: 24,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 1,
    },
    indexText: {
      color: colors.text,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
    },
    listText: {
      flex: 1,
      color: colors.text,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.medium,
    },
    reasonItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.s,
    },
    reasonDot: {
      width: 6,
      height: 6,
      borderRadius: 999,
      backgroundColor: colors.secondary,
      marginTop: 7,
    },
    reasonText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
    },
  });
