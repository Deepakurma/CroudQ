import { AuthHero } from "@/components/auth/AuthHero";
import { AppScreen } from "@/components/ui/AppScreen";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Badge } from "@/components/ui/Badge";
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

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function SignupScreen() {
  const { signup } = useAuth();
  const { colors } = useAppTheme();
  const router = useRouter();
  const styles = getStyles(colors);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (
    field: "name" | "email" | "password" | "confirmPassword",
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

  const handleSignup = async () => {
    const result = validateSchema(signupSchema, form);
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

      await signup({
        name: result.data.name,
        email: result.data.email,
        password: result.data.password,
      });
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

      <Card style={styles.card}>
        <View style={styles.indicationRow}>
          <Text style={styles.indication}>SIGN UP</Text>
          <Badge text="14-day premium trial" variant="active" />
        </View>

        <Text style={styles.title}>Start your CroudQ workspace</Text>

        <AppTextInput
          label="Name"
          value={form.name}
          onChangeText={(name) => updateField("name", name)}
          autoCapitalize="words"
          textContentType="name"
          error={errors.name}
          placeholder="Your name"
        />

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
          textContentType="newPassword"
          error={errors.password}
          placeholder="Create a password"
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
          placeholder="Confirm your password"
        />

        <Pressable
          style={[
            styles.primaryButton,
            isSubmitting ? styles.primaryButtonDisabled : null,
          ]}
          onPress={() => {
            void handleSignup();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Create account</Text>
          )}
        </Pressable>
      </Card>

      <View style={styles.authSwitchRow}>
        <Text style={styles.authSwitchText}>Already have an account?</Text>
        <Pressable onPress={() => router.push("/login" as never)}>
          <Text style={styles.authSwitchLink}>Sign in</Text>
        </Pressable>
      </View>
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
      gap: 12,
    },
    indicationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    indication: {
      color: colors.primary,
      fontFamily: Typography.font.regular,
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
  });
