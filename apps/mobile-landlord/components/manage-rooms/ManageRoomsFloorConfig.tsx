import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { Plus, Settings } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ManageRoomsFloorConfigProps {
  selectedFloor: string;
  onOpenSeriesConfig: () => void;
  onAddRoom: () => void;
}

export function ManageRoomsFloorConfig({
  selectedFloor,
  onOpenSeriesConfig,
  onAddRoom,
}: ManageRoomsFloorConfigProps) {
  if (selectedFloor === "All") return null;

  return (
    <View style={styles.floorSettingsBar}>
      <Text style={styles.floorSettingsText}>
        Add new room or edit room series
      </Text>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity style={styles.settingsButton} onPress={onAddRoom}>
          <Plus size={16} color={Colors.primary} />
          <Text style={styles.settingsButtonText}>Room</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={onOpenSeriesConfig}
        >
          <Settings size={16} color={Colors.primary} />
          <Text style={styles.settingsButtonText}>Series</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floorSettingsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  floorSettingsText: {
    fontSize: Typography.size.s,
    color: Colors.textSecondary,
    fontFamily: Typography.font.regular,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
});
