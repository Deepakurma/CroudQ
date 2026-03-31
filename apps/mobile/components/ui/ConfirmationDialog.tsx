import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "success" | "neutral";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  visible,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "neutral",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  const getConfirmBtnStyle = () => {
    switch (variant) {
      case "danger":
        return { backgroundColor: colors.error };
      case "success":
        return { backgroundColor: colors.success };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialog}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                  <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, getConfirmBtnStyle()]}
                  onPress={onConfirm}
                >
                  <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: Spacing.l,
    },
    dialog: {
      backgroundColor: colors.backgroundElevated,
      borderRadius: 24,
      padding: Spacing.xl,
      width: "100%",
      maxWidth: 320,
      gap: Spacing.l,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    title: {
      fontSize: Typography.size.l,
      fontFamily: Typography.font.semibold,
      color: colors.text,
      textAlign: "center",
    },
    description: {
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
      color: colors.textSecondary,
      textAlign: "center",
    },
    actions: {
      flexDirection: "row",
      gap: Spacing.m,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: Spacing.l,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardSecondary,
    },
    cancelBtnText: {
      fontSize: Typography.size.m,
      fontFamily: Typography.font.medium,
      color: colors.text,
    },
    confirmBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: Spacing.l,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmBtnText: {
      fontSize: Typography.size.m,
      fontFamily: Typography.font.semibold,
      color: colors.white,
    },
  });
