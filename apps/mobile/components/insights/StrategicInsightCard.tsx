import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { AlertTriangle, Repeat2 } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

type InsightPriority = "High impact" | "Needs fixing";

interface StrategicInsightCardProps {
  title: string;
  contextLabel: string;
  context: string;
  tag: InsightPriority;
}

export function StrategicInsightCard({
  title,
  contextLabel,
  context,
  tag,
}: StrategicInsightCardProps) {
  const { colors, isDark } = useAppTheme();
  const styles = getStyles(colors);
  const cardToneStyle =
    tag === "Needs fixing" ? styles.cardFriction : styles.cardWin;
  const cardStyle: ViewStyle = { ...styles.card, ...cardToneStyle };

  return (
    <Card style={cardStyle}>
      {tag === "Needs fixing" ? (
        <LinearGradient
          colors={
            isDark
              ? [
                  "rgba(255, 122, 144, 0.18)",
                  "rgba(255, 122, 144, 0.08)",
                  "rgba(255, 122, 144, 0.00)",
                ]
              : [
                  "rgba(213, 72, 103, 0.14)",
                  "rgba(213, 72, 103, 0.06)",
                  "rgba(213, 72, 103, 0.00)",
                ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.9 }}
          style={styles.frictionGlow}
        />
      ) : null}

      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Badge text={tag} variant={getBadgeVariant(tag)} />
      </View>

      <View style={styles.section}>
        <View style={styles.labelRow}>
          {tag === "Needs fixing" ? (
            <AlertTriangle size={14} color={colors.textMuted} />
          ) : (
            <Repeat2 size={14} color={colors.textMuted} />
          )}
          <Text style={styles.label}>{contextLabel}</Text>
        </View>
        <Text style={styles.body}>{context}</Text>
      </View>
    </Card>
  );
}

function getBadgeVariant(tag: StrategicInsightCardProps["tag"]) {
  switch (tag) {
    case "Needs fixing":
      return "negative";
    default:
      return "positive";
  }
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      gap: Spacing.l,
      backgroundColor: colors.backgroundElevated,
    },
    cardWin: {
      borderColor: colors.cardBorder,
    },
    cardFriction: {
      backgroundColor: colors.cardSecondary,
      borderColor: colors.cardBorder,
      overflow: "hidden",
    },
    frictionGlow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: Spacing.m,
    },
    title: {
      flex: 1,
      color: colors.text,
      fontSize: Typography.size.l,
      fontFamily: Typography.font.bold,
    },
    section: {
      gap: 6,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    label: {
      color: colors.textMuted,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    body: {
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
    },
  });
