import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { LucideIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  style,
  children,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {Icon && (
        <View style={styles.iconContainer}>
          <Icon size={25} color={Colors.textSecondary} />
        </View>
      )}
      {title && <Text style={styles.title}>{title}</Text>}
      {description && <Text style={styles.description}>{description}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
    textAlign: "center",
  },
  description: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 250,
  },
});
