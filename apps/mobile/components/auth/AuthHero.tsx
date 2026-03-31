import { AppColors } from "@/constants/Colors";
import { useAppTheme } from "@/context/ThemeContext";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { BrainCircuit, Sparkles, TrendingUp } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const heroPoints = [
  { icon: Sparkles, text: "Quickly understand what your comments really mean" },
  { icon: TrendingUp, text: "See why a video is taking off or falling flat" },
  { icon: BrainCircuit, text: "Get clear ideas for what to do next" },
];

export function AuthHero() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <LinearGradient colors={colors.gradients.hero} style={styles.card}>
      <Text style={styles.title}>
        Croud
        <Text style={styles.titleAccent}>Q</Text>
      </Text>
      <Text style={styles.subtitle}>
        Understand your audience faster and get clear next steps for what to
        post.
      </Text>

      <View style={styles.points}>
        {heroPoints.map(({ icon: Icon, text }) => (
          <View key={text} style={styles.pointRow}>
            <View style={styles.iconWrap}>
              <Icon size={16} color={colors.text} />
            </View>
            <Text style={styles.pointText}>{text}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      borderRadius: 32,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing["2xl"],
      gap: Spacing.s,
    },
    badge: {
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: "rgba(255,255,255,0.08)",
    },
    badgeText: {
      color: colors.textSecondary,
      fontFamily: Typography.font.semibold,
      fontSize: Typography.size.s,
    },
    title: {
      color: colors.text,
      fontFamily: Typography.font.bold,
      fontSize: Typography.size["5xl"],
    },
    titleAccent: {
      color: colors.primary,
    },
    subtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.font.regular,
      fontSize: Typography.size.l,
      marginBottom: 8,
    },
    points: {
      gap: Spacing.m,
    },
    pointRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.m,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.08)",
    },
    pointText: {
      flex: 1,
      color: colors.text,
      fontFamily: Typography.font.medium,
      fontSize: Typography.size.m,
    },
  });
