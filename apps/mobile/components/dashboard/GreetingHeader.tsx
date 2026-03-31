import { AppColors } from "@/constants/Colors";
import { useAuth, type HomePlatform } from "@/context/AuthContext";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { BellDot, Instagram, Youtube } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface GreetingHeaderProps {
  selectedPlatform: HomePlatform;
}

export function GreetingHeader({ selectedPlatform }: GreetingHeaderProps) {
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const styles = getStyles(colors);
  const SelectedIcon = selectedPlatform === "youtube" ? Youtube : Instagram;
  const selectedAccent = selectedPlatform === "youtube" ? "#FF3B30" : "#E4405F";
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Creator";

  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <View style={styles.sourceIndicator}>
          <SelectedIcon size={12} color={selectedAccent} />
          <Text style={[styles.sourceText, { color: selectedAccent }]}>
            {selectedPlatform === "youtube" ? "YouTube" : "Instagram"}
          </Text>
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {`Hey ${firstName}`}
          </Text>
          <Text style={styles.emoji}>👋</Text>
        </View>
      </View>
      <View style={styles.side}>
        <View style={styles.iconWrap}>
          <BellDot size={18} color={colors.text} />
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 4,
      gap: 14,
    },
    copy: {
      flex: 1,
      gap: 0,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    title: {
      color: colors.text,
      fontSize: Typography.size["4xl"],
      fontFamily: Typography.font.bold,
      flexShrink: 1,
    },
    emoji: {
      fontSize: Typography.size["4xl"],
      flexShrink: 0,
    },
    side: {
      alignItems: "flex-end",
      flexShrink: 0,
    },
    sourceIndicator: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 4,
    },
    sourceText: {
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
