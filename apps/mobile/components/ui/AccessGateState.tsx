import { EmptyState } from "@/components/EmptyState";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { LucideIcon } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type AccessGateStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  buttonText?: string;
  onPress?: () => void;
};

export function AccessGateState({
  icon,
  title,
  description,
  buttonText,
  onPress,
}: AccessGateStateProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        style={styles.emptyState}
      />
      {buttonText && (
        <Pressable style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </Pressable>
      )}
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: 50,
    },
    emptyState: {
      flexGrow: 0,
      justifyContent: "center",
      width: "100%",
    },
    button: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.m,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 18,
      elevation: 8,
    },
    buttonText: {
      color: colors.white,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.semibold,
    },
  });
