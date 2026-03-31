import { Card } from "@/components/ui/Card";
import { AppColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, Text } from "react-native";

export function InsightMetricCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </Card>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  card: {
    gap: 10,
    flex: 1,
  },
  title: {
    color: colors.textSecondary,
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
  },
  value: {
    color: colors.text,
    fontSize: Typography.size["3xl"],
    fontFamily: Typography.font.bold,
  },
  detail: {
    color: colors.textSecondary,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.regular,
  },
  });
