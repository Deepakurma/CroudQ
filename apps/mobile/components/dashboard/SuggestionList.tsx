import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/EmptyState";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { Sparkles } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface SuggestionListProps {
  items?: readonly string[];
}

export function SuggestionList({ items }: SuggestionListProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const resolvedItems = items ?? [];

  if (resolvedItems.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No suggestions yet"
        description="Next moves will appear after analysis is ready."
      />
    );
  }

  return (
    <View style={styles.list}>
      <Card style={styles.card}>
        <LinearGradient colors={colors.gradients.card} style={styles.gradient}>
          <View style={styles.header}>
            <View style={styles.headerLead}>
              <View style={styles.iconWrap}>
                <View style={styles.iconInner}>
                  <Sparkles size={16} color={colors.white} />
                </View>
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>AI suggestions</Text>
                <Text style={styles.kicker}>
                  Useful next moves based on this video
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.items}>
            {resolvedItems.map((suggestion) => (
              <View key={suggestion} style={styles.itemRow}>
                <View style={styles.bullet} />
                <Text style={styles.text}>{suggestion}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </Card>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    list: {
      gap: Spacing.l,
    },
    card: {
      padding: 0,
      overflow: "hidden",
    },
    gradient: {
      gap: Spacing.xl,
      padding: Spacing.xl,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: Spacing.m,
    },
    headerLead: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.m,
    },
    headerCopy: {
      flex: 1,
      gap: 2,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconInner: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    eyebrow: {
      color: colors.text,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    kicker: {
      color: colors.textMuted,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
    },
    items: {
      gap: Spacing.xl,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.m,
    },
    bullet: {
      width: 8,
      height: 8,
      borderRadius: 999,
      marginTop: 9,
      backgroundColor: colors.primary,
      flexShrink: 0,
    },
    text: {
      color: colors.text,
      fontSize: Typography.size.l,
      lineHeight: Typography.lineHeight.l,
      fontFamily: Typography.font.medium,
      flex: 1,
    },
  });
