import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { formatIndianCurrency } from "@/utils/common";
import { Check, LayoutGrid, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "./EmptyState";

import { trpc } from "@/utils/api";
import { useProperty } from "@/context/PropertyContext";

const { width } = Dimensions.get("window");
const COLUMNS = 4;
const TILE_SIZE = (width - Spacing.l * 2 - Spacing.s * (COLUMNS - 1)) / COLUMNS;

interface SelectRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (room: RoomOption) => void;
  selectedRoomNo?: string;
}

type RoomOption = {
  id: string;
  roomNumber: string;
  floor: string;
  type: string;
  isAc: boolean;
  price: string;
  totalCapacity: number;
  currentOccupancy: number;
};

export const SelectRoomModal = ({
  visible,
  onClose,
  onSelect,
  selectedRoomNo,
}: SelectRoomModalProps) => {
  const insets = useSafeAreaInsets();
  const { selectedPropertyId } = useProperty();

  // Fetch data
  const { data: fetchedRooms } = trpc.property.getRooms.useQuery(undefined, {
    enabled: !!selectedPropertyId,
  });
  const [selectedFloor, setSelectedFloor] = useState("All");

  const rooms = useMemo<RoomOption[]>(() => fetchedRooms ?? [], [fetchedRooms]);

  const filteredRooms = useMemo(() => {
    let result = rooms;
    if (selectedFloor !== "All") {
      result = result.filter((r) => r.floor === selectedFloor);
    }
    return result;
  }, [rooms, selectedFloor]);

  // Group by floor
  const roomsByFloor = useMemo(() => {
    const groups: Record<string, typeof rooms> = {};
    filteredRooms.forEach((room) => {
      if (!groups[room.floor]) groups[room.floor] = [];
      groups[room.floor].push(room);
    });
    return groups;
  }, [filteredRooms]);

  const dynamicFloors = useMemo(() => {
    const unique = Array.from(new Set(rooms.map((r) => r.floor))).sort(
      (a, b) => {
        if (a === "Ground") return -1;
        if (b === "Ground") return 1;
        return a.localeCompare(b, undefined, { numeric: true });
      },
    );
    return unique;
  }, [rooms]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent // Allows modal to draw under the status bar
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Room To Assign</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={25} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Filters Header (Fixed) */}
        <View style={styles.fixedHeader}>
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
              onPress={() => setSelectedFloor("All")}
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
            {dynamicFloors.map((floor) => (
              <TouchableOpacity
                key={floor}
                style={[
                  styles.filterChip,
                  selectedFloor === floor && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedFloor(floor)}
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
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {Object.keys(roomsByFloor).length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title="No Rooms Found"
              description="No rooms match your filter or are available."
              style={{ padding: Spacing.xl, marginTop: Spacing.xl }}
            />
          ) : (
            Object.keys(roomsByFloor).map((floor) => (
              <View key={floor} style={styles.floorSection}>
                <Text style={styles.floorTitle}>{floor} Floor</Text>
                <View style={styles.roomGrid}>
                  {roomsByFloor[floor].map((room) => {
                    const isSelected = selectedRoomNo === room.roomNumber;
                    const isFull = room.currentOccupancy >= room.totalCapacity;
                    const isDisabled = isFull;

                    return (
                      <TouchableOpacity
                        key={room.id}
                        style={[
                          styles.roomTile,
                          isSelected && styles.roomTileSelected,
                          isDisabled && styles.roomTileDisabled,
                        ]}
                        onPress={() => {
                          if (!isDisabled) {
                            onSelect(room);
                            onClose();
                          }
                        }}
                        activeOpacity={isDisabled ? 1 : 0.7}
                        disabled={isDisabled}
                      >
                        {/* Selection Check Overlay */}
                        {isSelected && (
                          <View style={styles.selectionCheck}>
                            <Check
                              size={12}
                              color={Colors.white}
                              strokeWidth={2.5}
                            />
                          </View>
                        )}

                        <View style={styles.tileContent}>
                          {/* Room Number */}
                          <Text
                            style={[
                              styles.roomNumber,
                              isSelected && styles.tileTextSelected,
                            ]}
                          >
                            {room.roomNumber}
                          </Text>

                          {/* Type Badge */}
                          <View style={styles.typeBadge}>
                            <Text style={styles.typeText}>{room.type}</Text>
                          </View>

                          {/* AC Badge */}
                          {room.isAc && (
                            <View style={styles.acBadge}>
                              <Text style={styles.acText}>AC</Text>
                            </View>
                          )}

                          {/* Price or Full Status */}
                          {isFull ? (
                            <Text style={styles.fullText}>Full</Text>
                          ) : (
                            <Text style={styles.priceText}>
                              {formatIndianCurrency(room.price)}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.l,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Spacing.xl,
    fontFamily: Typography.font.bold,
  },
  closeBtn: {
    padding: 4,
  },
  fixedHeader: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
    paddingVertical: Spacing.m,
    gap: Spacing.m,
  },
  filterContent: {
    paddingHorizontal: Spacing.l,
    gap: Spacing.s,
  },
  filterChip: {
    paddingHorizontal: Spacing.l,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterChipSelected: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  filterTextSelected: {
    color: Colors.white,
  },
  scrollContent: {
    paddingBottom: 50,
    gap: Spacing.l,
    paddingTop: Spacing.l,
  },
  floorSection: {
    paddingHorizontal: Spacing.l,
  },
  floorTitle: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.m,
  },
  roomGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  roomTile: {
    width: TILE_SIZE,
    height: 90,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 6,
  },
  roomTileSelected: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  tileContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  roomNumber: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.bold,
    color: Colors.text,
  },
  tileTextSelected: {
    color: Colors.primary,
  },
  selectionCheck: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: Colors.primary,
    borderRadius: 50,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
    zIndex: 10,
  },
  typeBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  acBadge: {
    backgroundColor: "#e0f2fe", // Light blue
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  acText: {
    fontSize: 10,
    fontFamily: Typography.font.medium,
    color: "#0284c7", // Dark blue
  },
  priceText: {
    fontSize: 12,
    fontFamily: Typography.font.medium,
    color: "#16a34a", // Green
  },
  roomTileDisabled: {
    backgroundColor: "#f3f4f6", // Light gray background
    borderColor: "#e5e7eb",
    opacity: 0.7,
  },
  fullText: {
    fontSize: 12,
    fontFamily: Typography.font.bold,
    color: Colors.error, // Red for Full status
  },
});
