import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarRange, CircleAlert } from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DatePickerProps {
  value: Date | null | undefined;
  onChange: (date: Date) => void;
  label?: string;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
  bottomSheet?: boolean;
}

export function DatePicker({
  value,
  onChange,
  label,
  error,
  minimumDate,
  maximumDate,
  placeholder = "DD/MM/YYYY",
  bottomSheet = false,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (event.type === "set" && selectedDate) {
        onChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleIosConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const handleIosCancel = () => {
    setShowPicker(false);
  };

  const openPicker = () => {
    setTempDate(value || new Date()); // Reset temp date to current value when opening
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.input, error ? styles.inputError : null]}
        onPress={openPicker}
      >
        <CalendarRange size={20} color={Colors.textSecondary} />
        <Text
          style={[styles.inputText, !value && { color: Colors.textSecondary }]}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <CircleAlert size={14} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {showPicker &&
        (Platform.OS === "ios" ? (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showPicker}
            onRequestClose={() => setShowPicker(false)}
            presentationStyle="overFullScreen"
          >
            <View style={styles.modalOverlay}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={handleIosCancel}
              />
              <Pressable style={styles.pickerContainer} onPress={() => null}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={handleIosCancel}>
                    <Text
                      style={{
                        color: Colors.error,
                        fontSize: Typography.size.m,
                        fontFamily: Typography.font.medium,
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleIosConfirm}>
                    <Text
                      style={{
                        color: Colors.primary,
                        fontSize: Typography.size.m,
                        fontFamily: Typography.font.semibold,
                      }}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  style={styles.iosPicker}
                />
              </Pressable>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.m,
  },
  label: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.s,
  },
  input: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.m,
    paddingVertical: 12,
    borderRadius: Spacing.m,
    borderWidth: 1,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.text,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.size.xs,
    color: Colors.error,
    fontFamily: Typography.font.medium,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  pickerContainer: {
    backgroundColor: "white",
    paddingBottom: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iosPicker: {
    height: 200,
  },
});
