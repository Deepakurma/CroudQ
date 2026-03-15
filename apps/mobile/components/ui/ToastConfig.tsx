import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CheckCircle, AlertCircle, Info } from "lucide-react-native";
import { BaseToastProps, ToastConfig } from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

import { Colors } from "@/constants/Colors";
import { CardShadow } from "@/constants/Shadows";
import { Typography } from "@/constants/Typography";
import { Spacing } from "@/constants/Spacing";

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }: BaseToastProps) => (
    <LinearGradient
      colors={["#F3FBF7", "#EAF7F0", "#E1F2E8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, styles.gradientToast]}
    >
      <CheckCircle size={18} color="#29be38" />
      <View style={styles.textWrap}>
        {text1 ? <Text style={styles.successTitle}>{text1}</Text> : null}
        {text2 ? <Text style={styles.subtitle}>{text2}</Text> : null}
      </View>
    </LinearGradient>
  ),

  error: ({ text1, text2 }: BaseToastProps) => (
    <LinearGradient
      colors={["#FDF4F4", "#FBECEC", "#F9E3E3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, styles.gradientToast]}
    >
      <AlertCircle size={18} color="#f00c0c" />
      <View style={styles.textWrap}>
        {text1 ? <Text style={styles.errorTitle}>{text1}</Text> : null}
        {text2 ? <Text style={styles.subtitle}>{text2}</Text> : null}
      </View>
    </LinearGradient>
  ),

  info: ({ text1, text2 }: BaseToastProps) => (
    <LinearGradient
      colors={["#F5F9FF", "#EDF4FF", "#E4EEFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, styles.gradientToast]}
    >
      <Info size={18} color={Colors.primary} />
      <View style={styles.textWrap}>
        {text1 ? <Text style={styles.infoTitle}>{text1}</Text> : null}
        {text2 ? <Text style={styles.subtitle}>{text2}</Text> : null}
      </View>
    </LinearGradient>
  ),
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: Spacing.m,
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    ...CardShadow,
    elevation: 5,
  },
  gradientToast: {
    borderWidth: 0,
  },
  textWrap: {
    marginLeft: 10,
    flex: 1,
  },
  infoTitle: {
    fontFamily: Typography.font.medium,
    fontSize: 14,
    color: Colors.primary,
  },
  subtitle: {
    fontFamily: Typography.font.regular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  successTitle: {
    fontFamily: Typography.font.medium,
    fontSize: 14,
    color: "#29be38",
  },
  errorTitle: {
    fontFamily: Typography.font.medium,
    fontSize: 14,
    color: "#f00c0c",
  },
});
