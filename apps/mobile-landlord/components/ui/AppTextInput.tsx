import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { CircleAlert } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  bottomSheet?: boolean;
}

export function AppTextInput({
  label,
  error,
  bottomSheet = false,
  style,
  ...props
}: AppTextInputProps) {
  const InputComponent = bottomSheet ? BottomSheetTextInput : TextInput;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <InputComponent
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={Colors.textSecondary}
        {...props}
      />
      {error && (
        <View style={styles.errorContainer}>
          <CircleAlert size={14} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.m,
  },
  label: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.s,
  },
  input: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.m,
    paddingVertical: 12,
    borderRadius: Spacing.m,
    fontSize: Typography.size.m,
    color: Colors.text,
    fontFamily: Typography.font.medium,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.size.xs,
    color: Colors.error,
    fontFamily: Typography.font.medium,
  },
});
