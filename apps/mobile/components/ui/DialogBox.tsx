import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

interface DialogBoxProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  variant?: "danger" | "success" | "neutral";
  keyboardAware?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export function DialogBox({
  visible,
  title,
  description,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  confirmDisabled = false,
  confirmLoading = false,
  variant = "neutral",
  keyboardAware = false,
  onConfirm,
  onCancel,
  children,
}: DialogBoxProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  const confirmStyle =
    variant === "danger"
      ? { backgroundColor: colors.error }
      : variant === "success"
        ? { backgroundColor: colors.success }
        : { backgroundColor: colors.primary };
  const dialogContent = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>

      {children ? <View style={styles.content}>{children}</View> : null}

      <View style={styles.actions}>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
        </Pressable>
        <Pressable
          disabled={confirmDisabled || confirmLoading}
          style={[
            styles.confirmButton,
            confirmStyle,
            confirmDisabled || confirmLoading
              ? styles.confirmButtonDisabled
              : null,
          ]}
          onPress={onConfirm}
        >
          <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
        </Pressable>
      </View>
    </>
  );

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
            {keyboardAware ? (
              <KeyboardAwareScrollView
                bottomOffset={24}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.overlayScrollContent}
                style={styles.keyboardScroll}
              >
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : undefined}
                  style={styles.keyboardWrap}
                >
                  <View style={styles.dialog}>{dialogContent}</View>
                </KeyboardAvoidingView>
              </KeyboardAwareScrollView>
            ) : (
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.keyboardWrap}
              >
                <View style={styles.dialog}>{dialogContent}</View>
              </KeyboardAvoidingView>
            )}
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
    keyboardWrap: {
      width: "100%",
      maxWidth: 360,
    },
    keyboardScroll: {
      width: "100%",
    },
    overlayScrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    dialog: {
      width: "100%",
      borderRadius: 24,
      padding: Spacing.xl,
      gap: Spacing.l,
      backgroundColor: colors.backgroundElevated,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    header: {
      gap: Spacing.s,
    },
    title: {
      color: colors.text,
      fontSize: Typography.size.xl,
      fontFamily: Typography.font.bold,
      textAlign: "center",
    },
    description: {
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
      textAlign: "center",
    },
    content: {
      gap: Spacing.m,
    },
    actions: {
      flexDirection: "row",
      gap: Spacing.m,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: Spacing.l,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.cardSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.medium,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: Spacing.l,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmButtonDisabled: {
      opacity: 0.7,
    },
    confirmButtonText: {
      color: colors.white,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.semibold,
    },
  });
