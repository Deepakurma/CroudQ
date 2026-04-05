import { AccountConnectCard } from "@/components/settings/AccountConnectCard";
import { AppScreen } from "@/components/ui/AppScreen";
import { Card } from "@/components/ui/Card";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AppColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type AccountRow = {
  id: string;
  platform: "YouTube" | "Instagram";
  handle: string;
  status: string;
  statusVariant?:
    | "active"
    | "pending"
    | "default"
    | "positive"
    | "negative"
    | "neutral";
  onPress?: () => void;
  disabled?: boolean;
};

export default function ConnectAccountScreen() {
  const router = useRouter();
  const {
    connectYouTube,
    disconnectYouTube,
    isYouTubeConnecting,
    youtubeConnection,
    user,
  } = useAuth();
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [isDisconnectDialogVisible, setIsDisconnectDialogVisible] =
    React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);

  const accounts: AccountRow[] = [
    {
      id: "yt",
      platform: "YouTube" as const,
      handle:
        youtubeConnection.channelName ||
        (youtubeConnection.isConnected
          ? user?.handle || "@connected"
          : "Tap to connect"),
      status: isYouTubeConnecting
        ? "Connecting"
        : youtubeConnection.isConnected
          ? "Disconnect"
          : "Not connected",
      statusVariant: youtubeConnection.isConnected ? "negative" : undefined,
      onPress: youtubeConnection.isConnected
        ? () => setIsDisconnectDialogVisible(true)
        : connectYouTube,
      disabled: isYouTubeConnecting,
    },
    {
      id: "ig",
      platform: "Instagram" as const,
      handle: "Coming soon",
      status: "Soon",
      disabled: true,
    },
  ];

  const handleDisconnect = async () => {
    setIsDisconnecting(true);

    try {
      await disconnectYouTube();
      setIsDisconnectDialogVisible(false);
    } finally {
      setIsDisconnecting(false);
    }
  };

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
          statusVariant={account.statusVariant}
          onPress={account.onPress}
          disabled={account.disabled}
        />
      ))}
      <Card>
        <Text style={styles.noteTitle}>Note</Text>

        <View style={styles.noteList}>
          <Text style={styles.noteItem}>
            Use Sync button to sync your latest upload for analysis.
          </Text>
          <Text style={styles.noteItem}>
            Recent uploads, comments, and stats are used to generate CroudQ
            insights.
          </Text>
          <Text style={styles.noteItem}>
            Dashboard insights are based on your recent upload (lastest video).
          </Text>
          <Text style={styles.noteItem}>
            Insights are generated from public video performance and public
            comments only.
          </Text>
          <Text style={styles.noteItem}>
            Private, unlisted, or members-only videos are not supported for
            insight generation.
          </Text>
          <Text style={styles.noteItem}>
            If comments are disabled or unavailable on a video, CroudQ cannot
            use them in analysis.
          </Text>
        </View>
      </Card>

      <ConfirmationDialog
        visible={isDisconnectDialogVisible}
        title="Disconnect YouTube?"
        description="This will remove your connected YouTube account and clear synced YouTube data from CroudQ."
        confirmLabel={isDisconnecting ? "Disconnecting..." : "Disconnect"}
        cancelLabel="Cancel"
        variant="danger"
        onCancel={() => {
          if (isDisconnecting) {
            return;
          }
          setIsDisconnectDialogVisible(false);
        }}
        onConfirm={() => {
          if (isDisconnecting) {
            return;
          }
          void handleDisconnect();
        }}
      />
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
      marginBottom: 6,
    },
    noteList: {
      marginTop: 12,
      gap: 8,
    },
    noteItem: {
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
    },
  });
