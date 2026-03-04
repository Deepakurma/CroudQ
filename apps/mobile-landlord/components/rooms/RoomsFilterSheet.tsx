import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React, { forwardRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RoomsFilterSheetProps {
  selectedFloor: string | null;
  setSelectedFloor: (floor: string | null) => void;
  availableFloors: string[];
  selectedType: string | null;
  setSelectedType: (type: string | null) => void;
  availableRoomTypes: string[];
  selectedAc: boolean | null;
  setSelectedAc: (ac: boolean | null) => void;
  onReset: () => void;
  onApply: () => void;
}

export const RoomsFilterSheet = forwardRef<
  BottomSheetModal,
  RoomsFilterSheetProps
>(
  (
    {
      selectedFloor,
      setSelectedFloor,
      availableFloors,
      selectedType,
      setSelectedType,
      availableRoomTypes,
      selectedAc,
      setSelectedAc,
      onReset,
      onApply,
    },
    ref,
  ) => {
    return (
      <AppBottomSheet ref={ref} enableDynamicSizing={true}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Filters</Text>
          <TouchableOpacity onPress={onReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Floor Section */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Floor</Text>
          <View style={styles.optionsRow}>
            {availableFloors.map((floor) => (
              <TouchableOpacity
                key={floor}
                style={[
                  styles.optionChip,
                  selectedFloor === floor && styles.optionChipSelected,
                ]}
                onPress={() =>
                  setSelectedFloor(floor === selectedFloor ? null : floor)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedFloor === floor && styles.optionTextSelected,
                  ]}
                >
                  {floor}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Type Section */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Room Type</Text>
          <View style={styles.optionsRow}>
            {availableRoomTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionChip,
                  selectedType === type && styles.optionChipSelected,
                ]}
                onPress={() =>
                  setSelectedType(type === selectedType ? null : type)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedType === type && styles.optionTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AC Section */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>AC Status</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionChip,
                selectedAc === true && styles.optionChipSelected,
              ]}
              onPress={() => setSelectedAc(selectedAc === true ? null : true)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedAc === true && styles.optionTextSelected,
                ]}
              >
                AC
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionChip,
                selectedAc === false && styles.optionChipSelected,
              ]}
              onPress={() => setSelectedAc(selectedAc === false ? null : false)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedAc === false && styles.optionTextSelected,
                ]}
              >
                Non-AC
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
          <Text style={styles.applyBtnText}>Apply Filters</Text>
        </TouchableOpacity>
      </AppBottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  sheetTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.font.bold,
    color: Colors.text,
  },
  resetText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.primary,
  },
  filterSection: {
    marginBottom: Spacing.xl,
    gap: Spacing.m,
  },
  sectionTitle: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.m,
  },
  optionChip: {
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: "transparent",
  },
  optionChipSelected: {
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  optionTextSelected: {
    color: Colors.white,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.m,
    borderRadius: Spacing.l,
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  applyBtnText: {
    color: Colors.white,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.bold,
  },
});
