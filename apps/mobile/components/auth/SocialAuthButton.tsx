import { Card } from "@/components/ui/Card";
import { AppColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { Chrome, ArrowRight } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface SocialAuthButtonProps {
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function SocialAuthButton({
  title,
  subtitle,
  onPress,
}: SocialAuthButtonProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.left}>
          <View style={styles.iconWrap}>
            <Chrome size={18} color={colors.text} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>
        <ArrowRight size={18} color={colors.textSecondary} />
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
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  copy: {
    gap: 4,
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
  },
  });
