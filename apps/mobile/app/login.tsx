import { AuthHero } from "@/components/auth/AuthHero";
import { AppScreen } from "@/components/ui/AppScreen";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Card } from "@/components/ui/Card";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { validateSchema } from "@/utils/validation";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: "email" | "password", value: string) => {
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

  const handleLogin = async () => {
    const result = validateSchema(loginSchema, form);
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

      await login(result.data);
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
      <AuthHero />

      <Card style={styles.formCard}>
        <Text style={styles.indication}>SIGN IN</Text>
        <View style={styles.formHeader}>
          <Text style={styles.title}>Welcome back</Text>
        </View>

        <AppTextInput
          label="Email"
          value={form.email}
          onChangeText={(email) => updateField("email", email)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          error={errors.email}
          placeholder="you@example.com"
        />

        <AppTextInput
          label="Password"
          value={form.password}
          onChangeText={(password) => updateField("password", password)}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          error={errors.password}
          placeholder="Enter your password"
        />

        <Pressable
          style={[
            styles.primaryButton,
            isSubmitting ? styles.primaryButtonDisabled : null,
          ]}
          onPress={() => {
            void handleLogin();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Sign in</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push("/forgot-password" as never)}>
          <Text style={styles.inlineLink}>Forgot your password?</Text>
        </Pressable>
      </Card>

      <View style={styles.authSwitchRow}>
        <Text style={styles.authSwitchText}>New here?</Text>
        <Pressable onPress={() => router.push("/signup" as never)}>
          <Text style={styles.authSwitchLink}>Sign up</Text>
        </Pressable>
      </View>

      <Text style={styles.footnote}>
        By continuing you agree to CroudQ&apos;s creator data policies.
      </Text>
    </AppScreen>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
    },
    formCard: {
      gap: 14,
    },
    indication: {
      color: colors.primary,
      fontFamily: Typography.font.regular,
    },
    formHeader: {
      gap: 8,
    },
    title: {
      color: colors.text,
      fontSize: Typography.size["3xl"],
      fontFamily: Typography.font.bold,
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
    inlineLink: {
      color: colors.primary,
      textAlign: "center",
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
    },
    authSwitchRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
    },
    authSwitchText: {
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
    },
    authSwitchLink: {
      color: colors.primary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.semibold,
    },
    footnote: {
      color: colors.textMuted,
      textAlign: "center",
      fontSize: Typography.size.s,
      fontFamily: Typography.font.regular,
      paddingHorizontal: Spacing.m,
    },
  });
