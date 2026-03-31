import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { CircleAlert, Eye, EyeOff } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Pressable,
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
  secureTextEntry,
  ...props
}: AppTextInputProps) {
  const { colors } = useAppTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const InputComponent = bottomSheet ? BottomSheetTextInput : TextInput;
  const isPasswordField = Boolean(secureTextEntry);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const resolvedSecureTextEntry = useMemo(() => {
    if (!isPasswordField) {
      return secureTextEntry;
    }

    return !isPasswordVisible;
  }, [isPasswordField, isPasswordVisible, secureTextEntry]);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputShell}>
        <InputComponent
          style={[
            styles.input,
            isPasswordField ? styles.inputWithAction : null,
            error ? styles.inputError : null,
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={resolvedSecureTextEntry}
          {...props}
        />
        {isPasswordField ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isPasswordVisible ? "Hide password" : "Show password"
            }
            hitSlop={10}
            onPress={() => setIsPasswordVisible((current) => !current)}
            style={styles.actionButton}
          >
            {isPasswordVisible ? (
              <EyeOff size={18} color={colors.textSecondary} />
            ) : (
              <Eye size={18} color={colors.textSecondary} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <CircleAlert size={14} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: { 
  text: string;
  textSecondary: string;
  cardSecondary: string;
  border: string;
  error: string;
}) =>
  StyleSheet.create({
    container: {},
    label: {
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
      color: colors.textSecondary,
      marginBottom: Spacing.s,
    },
    input: {
      backgroundColor: colors.cardSecondary,
      paddingHorizontal: Spacing.m,
      paddingVertical: 15,
      borderRadius: 18,
      fontSize: Typography.size.m,
      color: colors.text,
      fontFamily: Typography.font.medium,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputShell: {
      position: "relative",
    },
    inputWithAction: {
      paddingRight: 52,
    },
    actionButton: {
      position: "absolute",
      right: Spacing.m,
      top: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    inputError: {
      borderColor: colors.error,
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: Spacing.xs,
      gap: Spacing.xs,
    },
    errorText: {
      fontSize: Typography.size.xs,
      color: colors.error,
      fontFamily: Typography.font.medium,
    },
  });
