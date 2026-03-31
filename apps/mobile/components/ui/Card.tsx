import { AppColors } from "@/constants/Colors";
import { CardShadow } from "@/constants/Shadows";
import { useAppTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return <View style={[styles.card, style]}>{children}</View>;
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...CardShadow,
  },
  });
