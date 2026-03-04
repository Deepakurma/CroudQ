import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
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
  const getConfirmBtnStyle = () => {
    switch (variant) {
      case "danger":
        return { backgroundColor: Colors.error };
      case "success":
        return { backgroundColor: Colors.success };
      default:
        return { backgroundColor: Colors.primary };
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 320,
    gap: Spacing.l,
  },
  title: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
    textAlign: "center",
  },
  description: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
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
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.text,
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
    color: Colors.white,
  },
});
