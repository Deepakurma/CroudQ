import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { CardShadow } from "@/constants/Shadows";
import { AlertCircle, Send } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface CreateNoticeCardProps {
  noticeText: string;
  setNoticeText: (text: string) => void;
  selectedDuration: string;
  setSelectedDuration: (duration: string) => void;
  onPost: () => void;
  onCancel: () => void;
  durations: string[];
}

export function CreateNoticeCard({
  noticeText,
  setNoticeText,
  selectedDuration,
  setSelectedDuration,
  onPost,
  onCancel,
  durations,
}: CreateNoticeCardProps) {
  const [error, setError] = React.useState("");

  const handlePostFn = () => {
    if (!noticeText.trim()) {
      setError("Please enter notice content");
      return;
    }
    setError("");
    onPost();
  };

  return (
    <View style={styles.createCard}>
      <Text style={styles.cardTitle}>Create New Notice</Text>

      <View>
        <TextInput
          style={[styles.textInput, error ? styles.inputError : null]}
          placeholder="Write your notice here..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          textAlignVertical="top"
          value={noticeText}
          onChangeText={(text) => {
            setNoticeText(text);
            if (error) setError("");
          }}
        />
        {error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={14} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      {/* Duration Selection */}
      <View style={styles.durationSection}>
        <Text style={styles.subTitle}>Duration</Text>
        <View style={styles.chipsContainer}>
          {durations.map((duration) => (
            <TouchableOpacity
              key={duration}
              style={[
                styles.chip,
                selectedDuration === duration && styles.chipSelected,
              ]}
              onPress={() => setSelectedDuration(duration)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedDuration === duration && styles.chipTextSelected,
                ]}
              >
                {duration}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postBtn} onPress={handlePostFn}>
          <Send size={18} color={Colors.white} />
          <Text style={styles.postBtnText}>Post Notice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  createCard: {
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
  cardTitle: {
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
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  durationSection: {
    gap: Spacing.s,
  },
  subTitle: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.m,
    marginTop: Spacing.xs,
  },
  cancelBtn: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.l,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  postBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.l,
    borderRadius: 20,
  },
  postBtnText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.white,
  },
  inputError: {
    borderBottomWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
    color: Colors.error,
  },
});
