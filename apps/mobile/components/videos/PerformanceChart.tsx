import { Card } from "@/components/ui/Card";
import { AppColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function PerformanceChart({ values }: { values: number[] }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <Card style={styles.card}>
      <View style={styles.chart}>
        {values.map((value, index) => (
          <View key={`${value}-${index}`} style={styles.barWrap}>
            <View style={[styles.bar, { height: value * 1.6 }]} />
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>0s</Text>
        <Text style={styles.label}>mid</Text>
        <Text style={styles.label}>end</Text>
      </View>
    </Card>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  card: {
    gap: 16,
  },
  chart: {
    height: 180,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  barWrap: {
    flex: 1,
    justifyContent: "flex-end",
    height: "100%",
    backgroundColor: colors.chartGrid,
    borderRadius: 999,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: colors.secondary,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: colors.textMuted,
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
  },
  });
