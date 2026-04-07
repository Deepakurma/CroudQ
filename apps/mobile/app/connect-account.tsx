import { AccountConnectCard } from "@/components/settings/AccountConnectCard";
import { AppScreen } from "@/components/ui/AppScreen";
import { Card } from "@/components/ui/Card";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { FloatingDropdownMenu } from "@/components/ui/FloatingDropdownMenu";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { ChevronDown, ChevronLeft, ChevronUp } from "lucide-react-native";
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

const channelTypeOptions = [
  {
    value: "small" as const,
    label: "Emerging",
    description:
      "Choose this if you have less than 500K subscribers or followers.",
  },
  {
    value: "medium" as const,
    label: "Established",
    description:
      "Choose this if you have more than 500K subscribers or followers.",
  },
];

export default function ConnectAccountScreen() {
  const router = useRouter();
  const {
    connectYouTube,
    disconnectYouTube,
    isYouTubeConnecting,
    updateChannelType,
    youtubeConnection,
    user,
  } = useAuth();
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [channelType, setChannelType] = React.useState<"small" | "medium">(
    user?.channelType ?? "small",
  );
  const [isDisconnectDialogVisible, setIsDisconnectDialogVisible] =
    React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);

  React.useEffect(() => {
    setChannelType(user?.channelType ?? "small");
  }, [user?.channelType]);

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
        title="Connected accounts"
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

      <Card style={styles.channelTypeCard}>
        <Text style={styles.channelTypeSubtitle}>
          Choose what best defines you.
        </Text>

        <FloatingDropdownMenu
          align="left"
          menuWidth={280}
          renderTrigger={({ isOpen, toggle }) => (
            <Pressable
              style={[
                styles.dropdownTrigger,
                isOpen ? styles.dropdownTriggerOpen : null,
              ]}
              onPress={toggle}
            >
              <Text style={styles.dropdownTriggerText}>
                {channelType === "small" ? "Emerging" : "Established"}
              </Text>
              {isOpen ? (
                <ChevronUp size={18} color={colors.textSecondary} />
              ) : (
                <ChevronDown size={18} color={colors.textSecondary} />
              )}
            </Pressable>
          )}
        >
          {({ close }) => (
            <View style={styles.dropdownMenuContent}>
              {channelTypeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.dropdownOption,
                    channelType === option.value
                      ? styles.dropdownOptionActive
                      : null,
                  ]}
                  onPress={() => {
                    if (option.value === channelType) {
                      close();
                      return;
                    }

                    const previousChannelType = channelType;
                    setChannelType(option.value);
                    close();
                    void updateChannelType(option.value).catch(() => {
                      setChannelType(previousChannelType);
                    });
                  }}
                >
                  <View style={styles.dropdownOptionCopy}>
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        channelType === option.value
                          ? styles.dropdownOptionTextActive
                          : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.dropdownOptionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </FloatingDropdownMenu>
      </Card>

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
    channelTypeCard: {
      gap: 10,
    },
    channelTypeSubtitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
    },
    dropdownTrigger: {
      minHeight: 52,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardSecondary,
      paddingHorizontal: Spacing.l,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dropdownTriggerOpen: {
      borderColor: colors.primary,
    },
    dropdownTriggerText: {
      color: colors.text,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.medium,
    },
    dropdownMenuContent: {},
    dropdownOption: {
      borderRadius: 14,
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.m,
      backgroundColor: colors.backgroundElevated,
    },
    dropdownOptionActive: {
      backgroundColor: colors.cardSecondary,
    },
    dropdownOptionCopy: {
      gap: 2,
    },
    dropdownOptionText: {
      color: colors.text,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.medium,
    },
    dropdownOptionTextActive: {
      color: colors.primary,
    },
    dropdownOptionDescription: {
      color: colors.textSecondary,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.regular,
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
