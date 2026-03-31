import { useAppTheme } from "@/context/ThemeContext";
import { Typography } from "@/constants/Typography";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface BadgeProps {
  text: string;
  variant?: "active" | "pending" | "default" | "positive" | "negative" | "neutral";
}

export function Badge({ text, variant = "default" }: BadgeProps) {
  const { colors, isDark } = useAppTheme();
  const styles = getBadgeStyles();

  const getVariantStyle = () => {
    switch (variant) {
      case "active":
        return {
          bg: isDark ? "rgba(124, 92, 255, 0.18)" : "rgba(90, 88, 245, 0.12)",
          text: isDark ? "#CBB8FF" : "#4A46C8",
        };
      case "pending":
      case "neutral":
        return { bg: "rgba(243, 201, 105, 0.14)", text: colors.neutral };
      case "positive":
        return { bg: "rgba(61, 217, 163, 0.14)", text: colors.positive };
      case "negative":
        return { bg: "rgba(255, 122, 144, 0.14)", text: colors.negative };
      default:
        return { bg: colors.chip, text: colors.textSecondary };
    }
  };

  const style = getVariantStyle();

  return (
    <View style={[styles.container, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{text}</Text>
    </View>
  );
}

const getBadgeStyles = () =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: "flex-start",
      flexShrink: 0,
    },
    text: {
      fontSize: 12,
      fontFamily: Typography.font.semibold,
    },
  });
