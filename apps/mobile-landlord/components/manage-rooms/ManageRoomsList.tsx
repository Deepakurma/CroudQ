import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { formatIndianCurrency } from "@/utils/common";
import { Room } from "@/utils/roomData";
import { Check, LayoutGrid } from "lucide-react-native";
import React, { ReactElement } from "react";
import {
  Animated,
  Dimensions,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EmptyState } from "../EmptyState";

import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

interface ManageRoomsListProps {
  scrollY: Animated.Value;
  roomsByFloor: Record<string, Room[]>;
  selectedRoomIds: string[];
  onToggleSelection: (id: string) => void;
  headerComponent: ReactElement;
  contentHeaderComponent?: ReactElement;
  isLoading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const { width } = Dimensions.get("window");
// Revert to 4 columns as requested
const COLUMNS = 4;
const TILE_SIZE = (width - Spacing.l * 2 - Spacing.s * (COLUMNS - 1)) / COLUMNS;

export function ManageRoomsList({
  scrollY,
  roomsByFloor,
  selectedRoomIds,
  onToggleSelection,
  headerComponent,
  contentHeaderComponent,
  isLoading = false,
  refreshing = false,
  onRefresh,
}: ManageRoomsListProps) {
  return (
    <View style={styles.container}>
      {/* Fixed Header (passed as prop) */}
      <View style={styles.fixedHeader}>{headerComponent}</View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {contentHeaderComponent}

        {isLoading ? (
          <View style={{ padding: Spacing.l, gap: Spacing.l }}>
            {[1, 2].map((i) => (
              <View key={i}>
                <SkeletonLoader
                  width={100}
                  height={20}
                  style={{ marginBottom: Spacing.m }}
                />
                <View style={styles.roomGrid}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <SkeletonLoader
                      key={j}
                      width={TILE_SIZE}
                      height={90}
                      borderRadius={12}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <>
            {Object.keys(roomsByFloor).length === 0 ? (
              <EmptyState
                icon={LayoutGrid}
                title="No Rooms to Manage"
                description="Use the + button to add rooms."
                style={{ marginTop: Spacing.xl * 2 }}
              />
            ) : (
              Object.keys(roomsByFloor).map((floor) => (
                <View key={floor} style={styles.floorSection}>
                  <Text style={styles.floorTitle}>{floor} Floor</Text>
                  <View style={styles.roomGrid}>
                    {roomsByFloor[floor].map((room) => {
                      const isSelected = selectedRoomIds.includes(room.id);
                      return (
                        <TouchableOpacity
                          key={room.id}
                          style={[
                            styles.roomTile,
                            isSelected && styles.roomTileSelected,
                          ]}
                          onPress={() => onToggleSelection(room.id)}
                          activeOpacity={0.7}
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

                            {/* AC Badge - Only if AC */}
                            {room.isAc && (
                              <View style={styles.acBadge}>
                                <Text style={styles.acText}>AC</Text>
                              </View>
                            )}

                            {/* Price */}
                            <Text style={styles.priceText}>
                              {formatIndianCurrency(room.price)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    zIndex: 1,
    backgroundColor: Colors.white,
    // Add border/shadow if needed to match SelectRoomModal fixedHeader
  },
  scrollContent: {
    paddingBottom: 20,
  },
  floorSection: {
    paddingHorizontal: Spacing.l,
    marginTop: Spacing.l,
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
});
