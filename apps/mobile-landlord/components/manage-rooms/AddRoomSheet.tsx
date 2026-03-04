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

interface AddRoomSheetProps {
  floor: string;
  roomNumber: string;
  setRoomNumber: (text: string) => void;
  type: string | null;
  setType: (type: string) => void;
  isAc: boolean;
  setIsAc: (ac: boolean) => void;
  price: string;
  setPrice: (price: string) => void;
  onAdd: () => void;
  sharingTypes: string[];
}

export const AddRoomSheet = forwardRef<BottomSheetModal, AddRoomSheetProps>(
  (
    {
      floor,
      roomNumber,
      setRoomNumber,
      type,
      setType,
      isAc,
      setIsAc,
      price,
      setPrice,
      onAdd,
      sharingTypes,
    },
    ref,
  ) => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleAdd = () => {
      const schema = z.object({
        roomNumber: z.string().min(1, "Room Number is required"),
        price: z
          .string()
          .min(1, "Price is required")
          .regex(/^[0-9]+$/, "Price must be a valid number")
          .refine((v) => Number(v) > 0, "Price cannot be empty")
          .refine((v) => Number(v) <= 200000, "Price cannot exceed ₹2,00,000"),
      });

      const result = validateSchema(schema, { roomNumber, price });

      if (!result.success && result.errors) {
        setErrors(result.errors);
        return;
      }

      setErrors({});
      onAdd();
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
        <Text style={styles.sheetTitle}>Add Room to {floor}</Text>

        <View style={styles.sheetForm}>
          <AppTextInput
            label="Room Number"
            placeholder="e.g. 105"
            value={roomNumber}
            onChangeText={(t) => {
              setRoomNumber(t);
              if (errors.roomNumber)
                setErrors((prev) => ({ ...prev, roomNumber: "" }));
            }}
            bottomSheet
            error={errors.roomNumber}
          />

          <View>
            <Text style={styles.label}>Sharing Type</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {sharingTypes.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    type === t && styles.typeChipSelected,
                  ]}
                  onPress={() => {
                    setType(t);
                  }}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      type === t && styles.typeChipTextSelected,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.switchRow}
            activeOpacity={0.8}
            onPress={() => {
              setIsAc(!isAc);
            }}
          >
            <Text style={styles.switchLabel}>AC Room</Text>
            <Switch
              value={isAc}
              onValueChange={setIsAc}
              trackColor={{ false: "#e5e5e5", true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </TouchableOpacity>

          <AppTextInput
            label="Price per bed"
            placeholder="e.g. 7500"
            keyboardType="numeric"
            value={price ? formatIndianCurrency(price) : ""}
            onChangeText={(t) => {
              setPrice(t.replace(/[^0-9]/g, ""));
              if (errors.price) setErrors((prev) => ({ ...prev, price: "" }));
            }}
            bottomSheet
            error={errors.price}
          />

          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add Room</Text>
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
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.m,
    borderRadius: Spacing.l,
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.bold,
  },
});
