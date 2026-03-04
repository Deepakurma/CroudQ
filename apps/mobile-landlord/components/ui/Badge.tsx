import { Colors } from "@/constants/Colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface BadgeProps {
  text: string;
  variant?: "active" | "pending" | "default";
}

export function Badge({ text, variant = "default" }: BadgeProps) {
  const getStyles = () => {
    switch (variant) {
      case "active":
        return { bg: Colors.lightPurple, text: "#4f46e5" }; // Indigo
      case "pending":
        return { bg: "#fef3c7", text: "#d97706" }; // Amber
      default:
        return { bg: Colors.accent, text: "#374151" }; // Gray
    }
  };

  const style = getStyles();

  return (
    <View style={[styles.container, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});
