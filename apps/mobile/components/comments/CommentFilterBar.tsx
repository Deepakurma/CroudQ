import { AppColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

interface CommentFilterBarProps {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

export function CommentFilterBar({
  options,
  selected,
  onSelect,
}: CommentFilterBarProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(option)}
          >
            <Text style={[styles.text, active && styles.textActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  row: {
    gap: 10,
    paddingRight: 20,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    color: colors.textSecondary,
    fontSize: Typography.size.s,
    fontFamily: Typography.font.semibold,
  },
  textActive: {
    color: colors.white,
  },
  });
