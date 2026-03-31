import { AccountConnectCard } from "@/components/settings/AccountConnectCard";
import { AppScreen } from "@/components/ui/AppScreen";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AppColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

export default function ConnectAccountScreen() {
  const router = useRouter();
  const { connectYouTube, isYouTubeConnecting, youtubeConnection, user } = useAuth();
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  const accounts = [
    {
      id: "yt",
      platform: "YouTube" as const,
      handle:
        youtubeConnection.channelName ||
        (youtubeConnection.isConnected ? user?.handle || "@connected" : "Tap to connect"),
      status: isYouTubeConnecting
        ? "Connecting"
        : youtubeConnection.isConnected
          ? "Connected"
          : "Not connected",
      onPress: youtubeConnection.isConnected ? undefined : connectYouTube,
      disabled: isYouTubeConnecting || youtubeConnection.isConnected,
    },
    {
      id: "ig",
      platform: "Instagram" as const,
      handle: "Coming soon",
      status: "Soon",
      disabled: true,
    },
  ];

  return (
    <AppScreen>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <ChevronLeft size={24} color={colors.text} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <SectionHeader
        title="Connect accounts"
        subtitle="Bring in channel analytics so CroudQ can analyze performance and feedback"
      />

      {accounts.map((account) => (
        <AccountConnectCard
          key={account.id}
          platform={account.platform}
          handle={account.handle}
          status={account.status}
          onPress={account.onPress}
          disabled={account.disabled}
        />
      ))}
      <Card>
        <Text style={styles.noteTitle}>What gets synced</Text>
        <Text style={styles.noteText}>
          Recent uploads, comment sentiment, retention signals, and audience patterns used to generate CroudQ insights.
        </Text>
      </Card>
    </AppScreen>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: Typography.size["2xl"],
    fontFamily: Typography.font.semibold,
  },
  noteTitle: {
    color: colors.text,
    fontSize: Typography.size.xl,
    fontFamily: Typography.font.bold,
    marginBottom: 10,
  },
  noteText: {
    color: colors.textSecondary,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.regular,
  },
  });
