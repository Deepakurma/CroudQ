import { AlertCircle, CheckCircle2, Info } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { BaseToastProps, ToastConfig } from "react-native-toast-message";

import { darkColors } from "@/constants/Colors";
import { CardShadow } from "@/constants/Shadows";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";

type ToastTone = "success" | "error" | "info";

type ToastCardProps = BaseToastProps & {
  tone: ToastTone;
};

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return hex;
  }

  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function ToastCard({ text1, text2, tone }: ToastCardProps) {
  const styles = getStyles();
  const toneStyles = getToneStyles(tone);
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? AlertCircle : Info;

  return (
    <View style={[styles.container, { borderColor: toneStyles.borderColor }]}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: toneStyles.iconBackground,
            borderColor: toneStyles.iconBorder,
          },
        ]}
      >
        <Icon size={16} color={toneStyles.iconColor} />
      </View>

      <View style={styles.textWrap}>
        {text1 ? <Text style={styles.title}>{text1}</Text> : null}
        {text2 ? <Text style={styles.subtitle}>{text2}</Text> : null}
      </View>
    </View>
  );
}

const getToneStyles = (tone: ToastTone) => {
  const accentColor =
    tone === "success"
      ? darkColors.success
      : tone === "error"
        ? darkColors.error
        : darkColors.info;

  return {
    borderColor: hexToRgba(accentColor, 0.28),
    iconBackground: hexToRgba(accentColor, 0.14),
    iconBorder: hexToRgba(accentColor, 0.22),
    iconColor: accentColor,
  };
};

const getStyles = () =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.m,
      marginHorizontal: Spacing.l,
      paddingHorizontal: Spacing.l,
      paddingVertical: Spacing.m,
      borderRadius: 22,
      borderWidth: 1,
      backgroundColor: darkColors.backgroundElevated,
      ...CardShadow,
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 8,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      flexShrink: 0,
    },
    textWrap: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: darkColors.text,
      fontSize: Typography.size.m,
      lineHeight: Typography.lineHeight.m,
      fontFamily: Typography.font.semibold,
    },
    subtitle: {
      color: darkColors.textSecondary,
      fontSize: Typography.size.s,
      lineHeight: Typography.lineHeight.s,
      fontFamily: Typography.font.medium,
    },
  });

export const toastConfig: ToastConfig = {
  success: (props) => <ToastCard {...props} tone="success" />,
  error: (props) => <ToastCard {...props} tone="error" />,
  info: (props) => <ToastCard {...props} tone="info" />,
};

