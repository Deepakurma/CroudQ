import { AuthHero } from "@/components/auth/AuthHero";
import { AppScreen } from "@/components/ui/AppScreen";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { FloatingDropdownMenu } from "@/components/ui/FloatingDropdownMenu";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { openPrivacyPolicy, openTermsOfService } from "@/utils/external-links";
import { validateSchema } from "@/utils/validation";
import { useRouter } from "expo-router";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
    channelType: z.enum(["small", "medium"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

const OTP_RESEND_SECONDS = 30;
const OTP_LENGTH = 6;
const channelTypeOptions = [
  {
    value: "small" as const,
    label: "Emerging",
    description:
      "Choose this if you have less than 500K subscribers or followers.",
  },
  {
    value: "medium" as const,
    label: "Established",
    description:
      "Choose this if you have more than 500K subscribers or followers.",
  },
];

export default function SignupScreen() {
  const { requestSignupOtp, verifySignupOtp } = useAuth();
  const { colors } = useAppTheme();
  const router = useRouter();
  const styles = getStyles(colors);
  const [step, setStep] = useState<"details" | "otp">("details");
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    channelType: "small" as const,
  });
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [resendCooldown]);

  useEffect(() => {
    if (step !== "otp") {
      return;
    }

    const timeout = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);

    return () => clearTimeout(timeout);
  }, [step]);

  const updateField = (
    field: "name" | "email" | "password" | "confirmPassword" | "channelType",
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

  const handleRequestOtp = async () => {
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

      await requestSignupOtp({
        name: result.data.name,
        email: result.data.email,
        password: result.data.password,
        channelType: result.data.channelType,
      });
      setOtp(Array(OTP_LENGTH).fill(""));
      setFocusedIndex(0);
      setResendCooldown(OTP_RESEND_SECONDS);
      setStep("otp");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    const result = validateSchema(otpSchema, { code });
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

      await verifySignupOtp({
        email: form.email,
        code: result.data.code,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await requestSignupOtp({
        name: form.name,
        email: form.email,
        password: form.password,
        channelType: form.channelType,
      });
      setOtp(Array(OTP_LENGTH).fill(""));
      setFocusedIndex(0);
      inputRefs.current[0]?.focus();
      setResendCooldown(OTP_RESEND_SECONDS);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDetails = () => {
    setStep("details");
    setErrors({});
    setOtp(Array(OTP_LENGTH).fill(""));
    setFocusedIndex(null);
  };

  const handleOtpChange = (text: string, index: number) => {
    const sanitized = text.replace(/\D/g, "");

    setErrors((current) => ({ ...current, code: "" }));

    if (!sanitized) {
      setOtp((current) => {
        const next = [...current];
        next[index] = "";
        return next;
      });
      return;
    }

    if (sanitized.length > 1) {
      setOtp((current) => {
        const next = [...current];
        sanitized
          .slice(0, OTP_LENGTH)
          .split("")
          .forEach((digit, offset) => {
            const targetIndex = index + offset;
            if (targetIndex < OTP_LENGTH) {
              next[targetIndex] = digit;
            }
          });
        return next;
      });

      const nextFocusIndex = Math.min(index + sanitized.length, OTP_LENGTH - 1);
      inputRefs.current[nextFocusIndex]?.focus();
      return;
    }

    setOtp((current) => {
      const next = [...current];
      next[index] = sanitized;
      return next;
    });

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key !== "Backspace") {
      return;
    }

    if (otp[index]) {
      setOtp((current) => {
        const next = [...current];
        next[index] = "";
        return next;
      });
      return;
    }

    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
      setOtp((current) => {
        const next = [...current];
        next[index - 1] = "";
        return next;
      });
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
          <Badge text="14-day free trial" variant="active" />
        </View>

        {step === "details" ? (
          <>
            <Text style={styles.title}>Let’s get you started</Text>

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

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>What best defines you?</Text>
              <FloatingDropdownMenu
                align="left"
                menuWidth={280}
                renderTrigger={({ isOpen, toggle }) => (
                  <Pressable
                    style={[
                      styles.dropdownTrigger,
                      isOpen ? styles.dropdownTriggerOpen : null,
                      errors.channelType ? styles.dropdownTriggerError : null,
                    ]}
                    onPress={toggle}
                  >
                    <Text style={styles.dropdownTriggerText}>
                      {form.channelType === "small"
                        ? "Emerging"
                        : "Established"}
                    </Text>
                    {isOpen ? (
                      <ChevronUp size={18} color={colors.textSecondary} />
                    ) : (
                      <ChevronDown size={18} color={colors.textSecondary} />
                    )}
                  </Pressable>
                )}
              >
                {({ close }) => (
                  <View style={styles.dropdownMenuContent}>
                    {channelTypeOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.dropdownOption,
                          form.channelType === option.value
                            ? styles.dropdownOptionActive
                            : null,
                        ]}
                        onPress={() => {
                          updateField("channelType", option.value);
                          close();
                        }}
                      >
                        <View style={styles.dropdownOptionCopy}>
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              form.channelType === option.value
                                ? styles.dropdownOptionTextActive
                                : null,
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text style={styles.dropdownOptionDescription}>
                            {option.description}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </FloatingDropdownMenu>
              {errors.channelType ? (
                <Text style={styles.dropdownErrorText}>
                  {errors.channelType}
                </Text>
              ) : null}
            </View>

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
                void handleRequestOtp();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Continue</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Verify your email</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code we sent to {form.email}.
              </Text>
            </View>

            <View
              style={[
                styles.otpContainer,
                errors.code ? styles.otpContainerError : null,
              ]}
            >
              <Text style={styles.otpLabel}>Verification code</Text>
              <View style={styles.otpGrid}>
                {otp.map((digit, index) => {
                  return (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.otpSlot,
                        focusedIndex === index ? styles.otpSlotFocused : null,
                        digit ? styles.otpSlotFilled : null,
                        errors.code ? styles.otpSlotError : null,
                      ]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={({ nativeEvent }) =>
                        handleOtpKeyPress(nativeEvent.key, index)
                      }
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      autoFocus={index === 0}
                      editable={!isSubmitting}
                      textAlign="center"
                      textContentType={index === 0 ? "oneTimeCode" : "none"}
                    />
                  );
                })}
              </View>
            </View>
            {errors.code ? (
              <Text style={styles.otpErrorText}>{errors.code}</Text>
            ) : null}

            <Pressable
              style={[
                styles.primaryButton,
                isSubmitting ? styles.primaryButtonDisabled : null,
              ]}
              onPress={() => {
                void handleVerifyOtp();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Verify and create account
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                void handleResendOtp();
              }}
              disabled={isSubmitting || resendCooldown > 0}
            >
              <Text
                style={[
                  styles.secondaryAction,
                  isSubmitting || resendCooldown > 0
                    ? styles.secondaryActionDisabled
                    : null,
                ]}
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Resend code"}
              </Text>
            </Pressable>

            <Pressable onPress={handleEditDetails} disabled={isSubmitting}>
              <Text style={styles.secondaryAction}>Edit email or password</Text>
            </Pressable>
          </>
        )}
      </Card>

      <View style={styles.authSwitchRow}>
        <Text style={styles.authSwitchText}>Already have an account?</Text>
        <Pressable onPress={() => router.push("/login" as never)}>
          <Text style={styles.authSwitchLink}>Sign in</Text>
        </Pressable>
      </View>

      <View style={styles.footnoteWrap}>
        <Text style={styles.footnoteText}>By continuing you agree to our</Text>
        <View style={styles.footnoteLinksRow}>
          <Pressable onPress={() => void openPrivacyPolicy()}>
            <Text style={styles.footnoteLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.footnoteSeparator}>•</Text>
          <Pressable onPress={() => void openTermsOfService()}>
            <Text style={styles.footnoteLink}>Terms of Service</Text>
          </Pressable>
        </View>
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
    fieldWrap: {
      gap: 8,
    },
    fieldLabel: {
      color: colors.textSecondary,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
    },
    dropdownTrigger: {
      minHeight: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardSecondary,
      paddingHorizontal: Spacing.l,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dropdownTriggerOpen: {
      borderColor: colors.primary,
    },
    dropdownTriggerError: {
      borderColor: colors.error,
    },
    dropdownTriggerText: {
      color: colors.text,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.medium,
    },
    dropdownMenuContent: {},
    dropdownOption: {
      borderRadius: 14,
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.m,
      backgroundColor: colors.backgroundElevated,
    },
    dropdownOptionActive: {
      backgroundColor: colors.cardSecondary,
    },
    dropdownOptionCopy: {
      gap: 2,
    },
    dropdownOptionText: {
      color: colors.text,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.medium,
    },
    dropdownOptionTextActive: {
      color: colors.primary,
    },
    dropdownOptionDescription: {
      color: colors.textSecondary,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.regular,
    },
    dropdownErrorText: {
      color: colors.error,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.regular,
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
    headerCopy: {
      gap: 8,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
    },
    otpContainer: {
      gap: 12,
    },
    otpContainerError: {},
    otpLabel: {
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
      color: colors.textSecondary,
    },
    otpGrid: {
      flexDirection: "row",
      gap: 8,
    },
    otpSlot: {
      flex: 1,
      minHeight: 60,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardSecondary,
      alignItems: "center",
      justifyContent: "center",
      color: colors.text,
      fontSize: Typography.size.xl,
      fontFamily: Typography.font.bold,
    },
    otpSlotFocused: {
      borderColor: colors.primary,
    },
    otpSlotError: {
      borderColor: colors.error,
    },
    otpSlotFilled: {
      borderColor: colors.cardBorder,
    },
    otpErrorText: {
      marginTop: -4,
      color: colors.error,
      fontSize: Typography.size.xs,
      fontFamily: Typography.font.medium,
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
    secondaryAction: {
      color: colors.primary,
      textAlign: "center",
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
    },
    secondaryActionDisabled: {
      opacity: 0.5,
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
    footnoteWrap: {
      alignItems: "center",
      gap: 4,
      paddingHorizontal: Spacing.m,
    },
    footnoteLinksRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
    },
    footnoteText: {
      color: colors.textMuted,
      textAlign: "center",
      fontSize: Typography.size.s,
      fontFamily: Typography.font.regular,
    },
    footnoteSeparator: {
      color: colors.textMuted,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.regular,
    },
    footnoteLink: {
      color: colors.primary,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
    },
  });
