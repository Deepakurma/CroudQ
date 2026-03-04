import { GridBackground } from "@/components/GridBackground";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAuth } from "@/context/AuthContext";
import {
  getOtpErrorMessage,
  getTrpcErrorLogMessage,
  isOtpVerifyAttemptsExceededError,
} from "@/utils/trpc-error";
import { trpc } from "@/utils/api";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type UserRole = "VENDOR" | "RESIDENT";

export default function VerifyOtpScreen() {
  const utils = trpc.useUtils();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber as string;
  const reqIdParam = params.reqId;
  const initialReqId =
    typeof reqIdParam === "string"
      ? reqIdParam
      : Array.isArray(reqIdParam)
        ? reqIdParam[0]
        : "";
  const [reqId, setReqId] = useState(initialReqId);
  const { login, logout, setPostLoginInitializing } = useAuth();

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [shouldUseFreshOtpSession, setShouldUseFreshOtpSession] =
    useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = React.useRef<(TextInput | null)[]>([]);

  const initializeVendorSession = async () => {
    await Promise.all([
      utils.auth.getIdentity.fetch(),
      utils.property.getAllProperties.fetch(),
    ]);
  };

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const verifyOTPMutation = trpc.auth.verifyOTP.useMutation({
    onSuccess: async (data: any) => {
      setPostLoginInitializing(true);
      try {
        await login(data.token, data.user, data.identity);

        const roles = (data.identity?.roles || []) as UserRole[];
        const needsOnboarding = Boolean(data.identity?.needsOnboarding);

        if (needsOnboarding || roles.includes("VENDOR")) {
          await initializeVendorSession();
          return;
        }

        await logout();
        Toast.show({
          type: "error",
          text1: "Use Tenant App",
          text2: "This app is only for landlord accounts.",
        });
      } finally {
        setPostLoginInitializing(false);
      }
    },
    onError: (error) => {
      console.error("Verification failed:", getTrpcErrorLogMessage(error));
      setShouldUseFreshOtpSession(isOtpVerifyAttemptsExceededError(error));
      Toast.show({
        type: "error",
        text1: "Verification Failed",
        text2: getOtpErrorMessage(error, "verify"),
      });
      setIsLoading(false);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const sendOTPMutation = trpc.auth.sendOTP.useMutation({
    onSuccess: (data) => {
      if (typeof data?.reqId === "string" && data.reqId.trim().length > 0) {
        setReqId(data.reqId);
      }
      setOtp(["", "", "", ""]);
      setShouldUseFreshOtpSession(false);
      setTimer(30);
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Failed to Resend",
        text2: getOtpErrorMessage(error, "retry"),
      });
    },
  });

  const retryOTPMutation = trpc.auth.retryOTP.useMutation({
    onSuccess: (data) => {
      if (typeof data?.reqId === "string" && data.reqId.trim().length > 0) {
        setReqId(data.reqId);
      }
      setOtp(["", "", "", ""]);
      setShouldUseFreshOtpSession(false);
      setTimer(30);
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Failed to Resend",
        text2: getOtpErrorMessage(error, "retry"),
      });
    },
  });

  const otpString = otp.join("");

  const handleOtpChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    if (!reqId) {
      Toast.show({
        type: "error",
        text1: "OTP Session Expired",
        text2: "Please go back and request OTP again.",
      });
      return;
    }

    if (otpString.length < 4) {
      Toast.show({
        type: "error",
        text1: "Please enter the complete OTP",
      });
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    verifyOTPMutation.mutate({ phoneNumber, otp: otpString, reqId });
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    const shouldStartFreshSession = shouldUseFreshOtpSession;

    if (shouldStartFreshSession) {
      sendOTPMutation.mutate({ phoneNumber });
      return;
    }

    if (!reqId) {
      Toast.show({
        type: "error",
        text1: "OTP Session Expired",
        text2: "Please go back and request OTP again.",
      });
      return;
    }
    retryOTPMutation.mutate({ phoneNumber, reqId, retryChannel: 11 });
  };

  return (
    <GridBackground>
      <View style={[styles.topSection, { paddingTop: insets.top + 20 }]}>
        <View style={styles.brandingHeader}>
          <Image
            source={require("@/assets/images/Logo.png")}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <View style={styles.appNameContainer}>
            <Text style={styles.appName}>Bunkezy</Text>
            <Text style={styles.appSubText}>Managing Made Easy</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <Text style={styles.heroTitle}>Verify OTP</Text>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheet}>
              <View style={styles.formContainer}>
                <Text style={styles.otpSentText}>
                  OTP has been sent to +91 {phoneNumber}
                </Text>
                <View style={styles.otpGrid}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.otpBox,
                        focusedIndex === index && styles.otpBoxFocused,
                        digit ? styles.otpBoxFilled : null,
                      ]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      autoFocus={index === 0}
                      editable={!isLoading}
                      textAlign="center"
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    (otpString.length < 4 || isLoading) &&
                      styles.continueButtonDisabled,
                  ]}
                  onPress={handleVerifyOTP}
                  disabled={isLoading || otpString.length < 4}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.continueButtonText}>Verify</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendOTP}
                  disabled={
                    timer > 0 ||
                    retryOTPMutation.isPending ||
                    sendOTPMutation.isPending
                  }
                >
                  <Text style={styles.resendText}>
                    {timer > 0
                      ? `Resend OTP in ${timer}s`
                      : "Didn't receive code? Resend"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </GridBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  topSection: {
    paddingBottom: 40,
  },
  brandingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
    alignSelf: "flex-start",
    marginLeft: 5,
  },
  logoIcon: {
    width: 70,
    height: 70,
  },
  appNameContainer: {
    flexDirection: "column",
  },
  appSubText: {
    fontSize: Typography.size.s,
    color: Colors.white,
    fontFamily: Typography.font.regular,
    textTransform: "uppercase",
  },
  appName: {
    fontSize: Typography.size["3xl"],
    fontFamily: Typography.font.semibold,
    color: Colors.white,
  },
  heroTitle: {
    fontSize: Typography.size["3xl"],
    color: Colors.white,
    fontFamily: Typography.font.bold,
    marginBottom: Spacing.l,
    paddingHorizontal: Spacing.xl,
  },
  bottomSheetContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.xl,
    paddingTop: 30,
  },
  formContainer: {
    gap: Spacing.l,
  },
  otpSentText: {
    color: Colors.textSecondary,
    fontFamily: Typography.font.regular,
    fontSize: Typography.size.m,
  },
  otpGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.m,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.textSecondary,
    borderRadius: 14,
    fontSize: Typography.size.xl,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  otpBoxFocused: {
    borderColor: Colors.primary,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.xl,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    backgroundColor: "#C1C1C1",
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: Typography.font.semibold,
  },
  resendButton: {
    alignItems: "center",
  },
  resendText: {
    color: Colors.primary,
    fontFamily: Typography.font.medium,
    fontSize: Typography.size.m,
  },
});
