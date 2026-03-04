import { GridBackground } from "@/components/GridBackground";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { getOtpErrorMessage, getTrpcErrorLogMessage } from "@/utils/trpc-error";
import { trpc } from "@/utils/api";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const sendOTPMutation = trpc.auth.sendOTP.useMutation({
    onSuccess: (data) => {
      const reqId =
        typeof data?.reqId === "string" && data.reqId.trim().length > 0
          ? data.reqId
          : null;

      if (!reqId) {
        Toast.show({
          type: "error",
          text1: "OTP Session Error",
          text2: "Could not start OTP session. Please try again.",
        });
        return;
      }

      router.push({
        pathname: "/verify-otp",
        params: { phoneNumber, reqId },
      });
    },
    onError: (error: unknown) => {
      console.error("Failed to send OTP:", getTrpcErrorLogMessage(error));
      Toast.show({
        type: "error",
        text1: "Failed to send OTP",
        text2: getOtpErrorMessage(error, "send"),
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSendOTP = async () => {
    if (!/^\d{10}$/.test(phoneNumber)) {
      Toast.show({
        type: "error",
        text1: "Invalid Phone Number",
        text2: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();
    sendOTPMutation.mutate({ phoneNumber });
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
            <Text style={styles.appSubText}>Living Made Easy</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <Text style={styles.heroTitle}>Login / Sign Up</Text>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheet}>
              <View style={styles.formContainer}>
                <View
                  style={[
                    styles.dualInputContainer,
                    isFocused && styles.dualInputContainerFocused,
                  ]}
                >
                  <View style={styles.countryCodeContainer}>
                    <Text style={styles.countryCode}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.mainInput}
                    placeholder="Please enter mobile no."
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    editable={!isLoading}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />
                </View>

                <Text style={styles.instructionText}>
                  Enter your phone number. An OTP will be sent to this number.
                </Text>

                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    (!phoneNumber || phoneNumber.length < 10 || isLoading) &&
                      styles.continueButtonDisabled,
                  ]}
                  onPress={handleSendOTP}
                  disabled={isLoading || phoneNumber.length < 10}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.continueButtonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.legalFooter,
                  { marginBottom: insets.bottom + 20 },
                ]}
              >
                <Text style={styles.legalTopText}>
                  By continuing, you agree to our
                </Text>
                <View style={styles.legalLinksRow}>
                  <TouchableOpacity>
                    <Text style={styles.legalLink}>Terms & Conditions</Text>
                  </TouchableOpacity>
                  <Text style={styles.legalSeparator}> | </Text>
                  <TouchableOpacity>
                    <Text style={styles.legalLink}>Privacy Policy</Text>
                  </TouchableOpacity>
                </View>
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
    justifyContent: "space-between",
  },
  formContainer: {
    gap: Spacing.l,
  },
  dualInputContainer: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: Colors.textSecondary,
    borderRadius: Spacing.xl,
    height: 60,
    overflow: "hidden",
  },
  dualInputContainerFocused: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  countryCodeContainer: {
    width: 70,
    justifyContent: "center",
    alignItems: "center",
    borderRightColor: Colors.textSecondary,
    backgroundColor: Colors.accent,
  },
  countryCode: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.font.medium,
    color: Colors.text,
  },
  mainInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: Typography.size.xl,
    fontFamily: Typography.font.medium,
    color: Colors.text,
  },
  instructionText: {
    fontSize: Typography.size.m,
    color: Colors.textSecondary,
    fontFamily: Typography.font.regular,
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
  legalFooter: {
    alignItems: "center",
    gap: 4,
  },
  legalTopText: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Typography.font.bold,
  },
  legalLinksRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  legalLink: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: Typography.font.regular,
  },
  legalSeparator: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
