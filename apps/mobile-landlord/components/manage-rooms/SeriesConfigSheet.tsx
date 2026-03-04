import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { validateSchema } from "@/utils/validation";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React, { forwardRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { z } from "zod";

interface SeriesConfigSheetProps {
  floor: string;
  config: { prefix: string; startNum: string };
  setConfig: (config: { prefix: string; startNum: string }) => void;
  onApply: () => void;
}

export const SeriesConfigSheet = forwardRef<
  BottomSheetModal,
  SeriesConfigSheetProps
>(({ floor, config, setConfig, onApply }, ref) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleApply = () => {
    const schema = z.object({
      startNum: z.string().min(1, "Start Number is required"),
    });

    const result = validateSchema(schema, { startNum: config.startNum });

    if (!result.success && result.errors) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    onApply();
  };

  return (
    <AppBottomSheet
      ref={ref}
      enableDynamicSizing={true}
      contentContainerStyle={styles.sheetContent}
      onChange={(index) => {
        if (index === -1) {
          setErrors({});
        }
      }}
    >
      <Text style={styles.sheetTitle}>Configure {floor} Floor</Text>
      <Text
        style={{
          color: Colors.textSecondary,
          fontFamily: Typography.font.regular,
          marginBottom: Spacing.l,
        }}
      >
        This will renumber all rooms for this floor.
      </Text>

      <View style={styles.sheetForm}>
        <AppTextInput
          label="Series Prefix (Optional)"
          value={config.prefix}
          onChangeText={(t) => {
            const filtered = t
              .replace(/[^a-zA-Z0-9]/g, "")
              .substring(0, 2)
              .toUpperCase();
            setConfig({ ...config, prefix: filtered });
          }}
          placeholder="e.g. A, B, G or 1, 2, 3"
          bottomSheet
        />

        <View style={{ flexDirection: "row", gap: Spacing.m }}>
          <View style={{ flex: 1 }}>
            <AppTextInput
              label="Start Number"
              keyboardType="numeric"
              value={config.startNum}
              onChangeText={(t) => {
                // Only digits, max 3 chars
                const filtered = t.replace(/[^0-9]/g, "").substring(0, 3);
                setConfig({ ...config, startNum: filtered });
                if (errors.startNum)
                  setErrors((prev) => ({ ...prev, startNum: "" }));
              }}
              placeholder="e.g. 1, 101"
              bottomSheet
              error={errors.startNum}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>Apply Changes</Text>
        </TouchableOpacity>
      </View>
    </AppBottomSheet>
  );
});

const styles = StyleSheet.create({
  sheetContent: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.font.bold,
    color: Colors.text,
    marginBottom: Spacing.l,
  },
  sheetForm: {
    gap: Spacing.l,
  },
  label: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.m,
    paddingVertical: 12,
    borderRadius: Spacing.m,
    fontSize: Typography.size.m,
    color: Colors.text,
    fontFamily: Typography.font.medium,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.m,
    borderRadius: Spacing.l,
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  applyButtonText: {
    color: Colors.white,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.bold,
  },
});
