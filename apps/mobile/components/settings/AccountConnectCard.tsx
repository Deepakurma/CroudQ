import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AppColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { Instagram, Youtube } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface AccountConnectCardProps {
  platform: "YouTube" | "Instagram";
  handle: string;
  status: string;
  onPress?: () => void;
  disabled?: boolean;
}

export function AccountConnectCard({
  platform,
  handle,
  status,
  onPress,
  disabled = false,
}: AccountConnectCardProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const Icon = platform === "YouTube" ? Youtube : Instagram;
  const variant =
    disabled && status !== "Connected"
      ? "default"
      : status === "Connected"
        ? "positive"
        : "pending";

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Card style={[styles.card, disabled ? styles.cardDisabled : null]}>
        <View style={styles.left}>
          <View
            style={[styles.iconWrap, disabled ? styles.iconWrapDisabled : null]}
          >
            <Icon size={20} color={colors.text} />
          </View>
          <View style={styles.copy}>
            <Text
              style={[styles.platform, disabled ? styles.textDisabled : null]}
            >
              {platform}
            </Text>
            <Text
              style={[styles.handle, disabled ? styles.textDisabled : null]}
            >
              {handle}
            </Text>
          </View>
        </View>
        <View style={styles.badgeWrap}>
          <Badge text={status} variant={variant} />
        </View>
      </Card>
    </Pressable>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    left: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardSecondary,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    platform: {
      color: colors.text,
      fontSize: Typography.size.l,
      fontFamily: Typography.font.semibold,
    },
    handle: {
      color: colors.textSecondary,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
    },
    badgeWrap: {
      alignSelf: "center",
      justifyContent: "center",
    },
    cardDisabled: {
      opacity: 0.78,
    },
    iconWrapDisabled: {
      backgroundColor: colors.backgroundMuted,
    },
    textDisabled: {
      color: colors.textMuted,
    },
  });
