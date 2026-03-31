import { AppColors } from "@/constants/Colors";
import { useAppTheme } from "@/context/ThemeContext";
import { Typography } from "@/constants/Typography";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
}: SectionHeaderProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? <Text style={styles.action}>{actionLabel}</Text> : null}
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: Typography.size["2xl"],
    fontFamily: Typography.font.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.regular,
  },
  action: {
    color: colors.secondary,
    fontSize: Typography.size.s,
    fontFamily: Typography.font.semibold,
    marginTop: 6,
  },
  });
