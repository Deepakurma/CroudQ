import { Colors } from "@/constants/Colors";
import { CardShadow } from "@/constants/Shadows";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { AlertCircle, Send } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ComplaintComposerProps {
  complaintText: string;
  setComplaintText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}

export function ComplaintComposer({
  complaintText,
  setComplaintText,
  onSubmit,
  onClear,
}: ComplaintComposerProps) {
  const [error, setError] = React.useState("");

  const handleSubmit = () => {
    if (!complaintText.trim()) {
      setError("Please describe your complaint");
      return;
    }
    setError("");
    onSubmit();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Write Complaint</Text>

      <View>
        <TextInput
          style={[styles.textInput, error ? styles.inputError : null]}
          placeholder="Describe your issue..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          textAlignVertical="top"
          value={complaintText}
          onChangeText={(text) => {
            setComplaintText(text);
            if (error) setError("");
          }}
        />
        {error ? (
          <View style={styles.errorRow}>
            <AlertCircle size={14} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Send size={16} color={Colors.white} />
          <Text style={styles.submitBtnText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.l,
    gap: Spacing.l,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    ...CardShadow,
    elevation: 1,
  },
  title: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
  },
  textInput: {
    minHeight: 60,
    fontSize: Typography.size.l,
    fontFamily: Typography.font.regular,
    color: Colors.text,
    textAlignVertical: "top",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  inputError: {
    borderBottomWidth: 1,
    borderColor: Colors.error,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
    color: Colors.error,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.m,
  },
  clearBtn: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.l,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearBtnText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.l,
    borderRadius: 20,
  },
  submitBtnText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.white,
  },
});
