import { AppColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { LucideIcon } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface SettingsRowProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  titleAccessory?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
}

export function SettingsRow({
  icon: Icon,
  title,
  subtitle,
  titleAccessory,
  trailing,
  onPress,
}: SettingsRowProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Icon size={18} color={colors.text} />
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {titleAccessory}
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {trailing}
    </Pressable>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardSecondary,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  title: {
    flexShrink: 1,
    color: colors.text,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
  },
  });
