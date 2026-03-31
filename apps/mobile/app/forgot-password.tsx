import { AppScreen } from "@/components/ui/AppScreen";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Card } from "@/components/ui/Card";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { validateSchema } from "@/utils/validation";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export default function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setErrors((current) => {
      if (!current.email) {
        return current;
      }

      return {
        ...current,
        email: "",
      };
    });
  };

  const handleSubmit = async () => {
    const result = validateSchema(forgotPasswordSchema, { email });
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

      await requestPasswordReset(result.data.email);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen dismissKeyboardOnTap contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Forgot your password?</Text>
          <Text style={styles.subtitle}>
            Enter your email and we&apos;ll send you a secure link to reset it.
          </Text>
        </View>

        <AppTextInput
          label="Email"
          value={email}
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          error={errors.email}
          placeholder="you@example.com"
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
            <Text style={styles.primaryButtonText}>Send reset link</Text>
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
