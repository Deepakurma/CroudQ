import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Switch } from "@/components/ui/Switch";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { formatIndianCurrency } from "@/utils/common";
import { validateSchema } from "@/utils/validation";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React, { forwardRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { z } from "zod";

interface EditRoomSheetProps {
  selectedCount: number;
  editRoomNumber: string;
  setEditRoomNumber: (text: string) => void;
  editType: string | null;
  setEditType: (type: string) => void;
  editAc: boolean;
  setEditAc: (ac: boolean) => void;
  editPrice: string;
  setEditPrice: (price: string) => void;
  onApply: () => void;
  sharingTypes: string[];
}

export const EditRoomSheet = forwardRef<BottomSheetModal, EditRoomSheetProps>(
  (
    {
      selectedCount,
      editRoomNumber,
      setEditRoomNumber,
      editType,
      setEditType,
      editAc,
      setEditAc,
      editPrice,
      setEditPrice,
      onApply,
      sharingTypes,
    },
    ref,
  ) => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleApply = () => {
      const schemaShape: any = {
        editPrice: z
          .string()
          .min(1, "Price is required")
          .regex(/^[0-9]+$/, "Price must be a valid number")
          .refine((v) => Number(v) > 0, "Price cannot be empty")
          .refine((v) => Number(v) <= 200000, "Price cannot exceed ₹2,00,000"),
      };

      if (selectedCount === 1) {
        schemaShape.editRoomNumber = z
          .string()
          .min(1, "Room Number is required");
      }

      const schema = z.object(schemaShape);
      const result = validateSchema(schema, { editPrice, editRoomNumber });

      if (!result.success && result.errors) {
        // Map error keys
        const mappedErrors: Record<string, string> = {};
        if (result.errors.editRoomNumber)
          mappedErrors.roomNumber = result.errors.editRoomNumber;
        if (result.errors.editPrice)
          mappedErrors.price = result.errors.editPrice;

        setErrors(mappedErrors);
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
        <Text style={styles.sheetTitle}>Edit {selectedCount} Room(s)</Text>

        <View style={styles.sheetForm}>
          {/* Room Number Input - Only if 1 room selected */}
          {selectedCount === 1 && (
            <AppTextInput
              label="Room Number"
              placeholder="e.g. 101"
              value={editRoomNumber}
              onChangeText={(t) => {
                setEditRoomNumber(t);
                if (errors.roomNumber)
                  setErrors((prev) => ({ ...prev, roomNumber: "" }));
              }}
              bottomSheet
              error={errors.roomNumber}
            />
          )}

          <View>
            <Text style={styles.label}>Sharing Type</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {sharingTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    editType === type && styles.typeChipSelected,
                  ]}
                  onPress={() => {
                    setEditType(type);
                  }}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      editType === type && styles.typeChipTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.switchRow}
            activeOpacity={0.8}
            onPress={() => {
              setEditAc(!editAc);
            }}
          >
            <Text style={styles.switchLabel}>AC Room</Text>
            <Switch
              value={editAc}
              onValueChange={setEditAc}
              trackColor={{ false: "#e5e5e5", true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </TouchableOpacity>

          <AppTextInput
            label="Price per bed"
            placeholder="e.g. 7500"
            keyboardType="numeric"
            value={editPrice ? formatIndianCurrency(editPrice) : ""}
            onChangeText={(t) => {
              setEditPrice(t.replace(/[^0-9]/g, ""));
              if (errors.price) setErrors((prev) => ({ ...prev, price: "" }));
            }}
            bottomSheet
            error={errors.price}
          />

          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Changes</Text>
          </TouchableOpacity>
        </View>
      </AppBottomSheet>
    );
  },
);

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
  typeChip: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: Spacing.s,
    alignSelf: "flex-end",
  },
  typeChipSelected: {
    backgroundColor: Colors.primary, // Light primary
  },
  typeChipText: {
    fontSize: Typography.size.s,
    color: Colors.textSecondary,
    fontFamily: Typography.font.medium,
  },
  typeChipTextSelected: {
    color: Colors.white,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderColor: Colors.border,
    borderWidth: 1,
    paddingHorizontal: Spacing.m,
    borderRadius: Spacing.m,
    fontSize: Typography.size.m,
    height: 50,
  },
  switchLabel: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.text,
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
