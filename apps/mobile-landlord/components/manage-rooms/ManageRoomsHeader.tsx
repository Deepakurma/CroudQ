import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { SlidersHorizontal, X } from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ManageRoomsHeaderProps {
  floors: string[];
  selectedFloor: string;
  setSelectedFloor: (floor: string) => void;
  selectedRoomCount: number;
  onClearSelection: () => void;
  onEditPress: () => void;
}

export function ManageRoomsHeader({
  floors,
  selectedFloor,
  setSelectedFloor,
  selectedRoomCount,
  onClearSelection,
  onEditPress,
}: ManageRoomsHeaderProps) {
  return (
    <View style={styles.Header}>
      {/* Floor Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedFloor === "All" && styles.filterChipSelected,
          ]}
          onPress={() => {
            setSelectedFloor("All");
          }}
        >
          <Text
            style={[
              styles.filterText,
              selectedFloor === "All" && styles.filterTextSelected,
            ]}
          >
            All Floors
          </Text>
        </TouchableOpacity>
        {floors.map((floor) => (
          <TouchableOpacity
            key={floor}
            style={[
              styles.filterChip,
              selectedFloor === floor && styles.filterChipSelected,
            ]}
            onPress={() => {
              setSelectedFloor(floor);
            }}
          >
            <Text
              style={[
                styles.filterText,
                selectedFloor === floor && styles.filterTextSelected,
              ]}
            >
              {floor}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sub-header Actions (Edit Bar OR Floor Settings) */}
      {selectedRoomCount > 0 ? (
        // 1. Edit Mode Active
        <View style={styles.editBar}>
          <View style={styles.selectionInfo}>
            <TouchableOpacity
              onPress={onClearSelection}
              style={styles.clearBtn}
            >
              <X size={18} color={Colors.error} />
            </TouchableOpacity>
            <Text style={styles.selectionText}>
              {selectedRoomCount} Selected
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
            <SlidersHorizontal size={16} color={Colors.white} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  Header: {
    backgroundColor: Colors.background,
  },
  filterContent: {
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    gap: Spacing.m,
  },
  filterChip: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 1,
  },
  filterChipSelected: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
  },
  filterTextSelected: {
    color: Colors.white,
  },
  editBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  floorSettingsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    backgroundColor: Colors.white,
  },
  floorSettingsText: {
    fontSize: Typography.size.s,
    color: Colors.textSecondary,
    fontFamily: Typography.font.medium,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 6,
    borderRadius: Spacing.s,
    backgroundColor: "#e0f2fe",
  },
  settingsButtonText: {
    fontSize: Typography.size.s,
    color: Colors.primary,
    fontFamily: Typography.font.medium,
  },
  selectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  clearBtn: {
    padding: 4,
  },
  selectionText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.bold,
    color: Colors.text,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.m,
    paddingVertical: 8,
    borderRadius: Spacing.m,
    gap: 6,
  },
  editButtonText: {
    color: Colors.white,
    fontFamily: Typography.font.semibold,
    fontSize: Typography.size.s,
  },
});
