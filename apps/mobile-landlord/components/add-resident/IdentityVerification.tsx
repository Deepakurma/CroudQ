import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { ShieldCheck } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface IdentityVerificationProps {
  onVerify: (aadhaar: string) => void;
  onSkip: () => void;
  isLoading: boolean;
}

export function IdentityVerification({
  onVerify,
  onSkip,
  isLoading,
}: IdentityVerificationProps) {
  const [aadhaar, setAadhaar] = useState("");

  const handleVerify = () => {
    if (aadhaar.length === 12) {
      onVerify(aadhaar);
    } else {
      alert("Please enter a valid 12-digit Aadhaar number");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <ShieldCheck size={32} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Identity Verification</Text>
        <Text style={styles.subtitle}>
          Verify Aadhaar to auto-fill resident details
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Aadhaar Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 12-digit Aadhaar Number"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="numeric"
            maxLength={12}
            value={aadhaar}
            onChangeText={(text) => setAadhaar(text.replace(/[^0-9]/g, ""))}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.verifyBtn,
            aadhaar.length !== 12 && styles.verifyBtnDisabled,
          ]}
          onPress={handleVerify}
          disabled={isLoading || aadhaar.length !== 12}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.verifyBtnText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.manualBtn} onPress={onSkip}>
          <Text style={styles.manualBtnText}>Enter details manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xl,
    paddingVertical: Spacing.l,
  },
  header: {
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 50,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6FF", // Light blue bg
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.s,
  },
  title: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.font.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  form: {
    gap: Spacing.l,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.text,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.l,
    paddingHorizontal: Spacing.m,
    height: 50,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.text,
  },
  verifyBtn: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: Spacing.l,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBtnDisabled: {
    opacity: 0.5,
  },
  verifyBtnText: {
    color: Colors.white,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.bold,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  manualBtn: {
    height: 50,
    borderRadius: Spacing.l,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  manualBtnText: {
    color: Colors.text,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
  },
});
