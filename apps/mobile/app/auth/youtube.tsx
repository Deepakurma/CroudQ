import { AppScreen } from "@/components/ui/AppScreen";
import { AppColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/context/ThemeContext";

export default function YoutubeAuthRedirectScreen() {
  const router = useRouter();
  const { youtubeConnection, isYouTubeConnecting } = useAuth();
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/connect-account" as never);
    }, 600);

    return () => clearTimeout(timeout);
  }, [router, youtubeConnection.isConnected]);

  return (
    <AppScreen contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.title}>
          {isYouTubeConnecting ? "Finishing YouTube connection..." : "Returning to your workspace..."}
        </Text>
        <Text style={styles.subtitle}>
          {youtubeConnection.isConnected
            ? "Your YouTube connection is ready."
            : "We’re syncing your channel details now."}
        </Text>
      </View>
    </AppScreen>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
    },
    content: {
      alignItems: "center",
      gap: 12,
    },
    title: {
      color: colors.text,
      fontSize: Typography.size.xl,
      fontFamily: Typography.font.semibold,
      textAlign: "center",
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
      textAlign: "center",
    },
  });
