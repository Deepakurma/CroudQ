import { AppScreen } from "@/components/ui/AppScreen";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Card } from "@/components/ui/Card";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { validateSchema } from "@/utils/validation";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = useMemo(() => {
    if (Array.isArray(params.token)) {
      return params.token[0] || "";
    }
    return params.token || "";
  }, [params.token]);
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (
    field: "password" | "confirmPassword",
    value: string,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      return {
        ...current,
        [field]: "",
      };
    });
  };

  const handleSubmit = async () => {
    if (!token) {
      setErrors({ password: "Missing reset token" });
      return;
    }

    const result = validateSchema(resetPasswordSchema, form);
    if (!result.success) {
      setErrors(result.errors || {});
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      if (!result.data) {
        return;
      }

      await resetPassword(token, result.data.password);
      router.replace("/login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen
      keyboardAware
      dismissKeyboardOnTap
      contentContainerStyle={styles.container}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose a new password</Text>
          <Text style={styles.subtitle}>
            Set a new password for your CroudQ account.
          </Text>
        </View>

        <AppTextInput
          label="New password"
          value={form.password}
          onChangeText={(password) => updateField("password", password)}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          error={errors.password}
          placeholder="Create a new password"
        />

        <AppTextInput
          label="Confirm password"
          value={form.confirmPassword}
          onChangeText={(confirmPassword) =>
            updateField("confirmPassword", confirmPassword)
          }
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          error={errors.confirmPassword}
          placeholder="Confirm your new password"
        />

        <Pressable
          style={[
            styles.primaryButton,
            isSubmitting ? styles.primaryButtonDisabled : null,
          ]}
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Update password</Text>
          )}
        </Pressable>

        <Link href="/login" style={styles.link}>
          Back to sign in
        </Link>
      </Card>
    </AppScreen>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
    },
    card: {
      gap: 14,
    },
    header: {
      gap: 8,
    },
    title: {
      color: colors.text,
      fontSize: Typography.size["3xl"],
      fontFamily: Typography.font.bold,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
    },
    primaryButton: {
      padding: Spacing.m,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.semibold,
    },
    link: {
      color: colors.primary,
      textAlign: "center",
      fontSize: Typography.size.m,
      fontFamily: Typography.font.semibold,
    },
  });
