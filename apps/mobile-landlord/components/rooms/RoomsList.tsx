import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { Bed, DoorOpen } from "lucide-react-native";
import React, { ReactElement } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EmptyState } from "../EmptyState";
import { RoomSkeletonCard } from "../skeletons/RoomSkeletonCard";
import { CardShadow } from "@/constants/Shadows";

interface RoomData {
  id: string;
  roomNumber: string;
  floor: string;
  type: string;
  isAc: boolean;
  beds: { id: string; status: "occupied" | "vacant" }[];
}

interface RoomsListProps {
  data: RoomData[];
  scrollY: Animated.Value;
  headerHeight: number;
  ListHeaderComponent?: ReactElement;
  onRoomPress: (room: any) => void;
  isLoading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function RoomsList({
  data,
  scrollY,
  headerHeight,
  ListHeaderComponent,
  onRoomPress,
  isLoading,
  refreshing,
  onRefresh,
}: RoomsListProps) {
  if (isLoading) {
    return (
    <Animated.ScrollView
      contentContainerStyle={[
        styles.listContent,
        { paddingTop: headerHeight, paddingHorizontal: Spacing.l },
      ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {ListHeaderComponent}
        {[1, 2, 3, 4, 5].map((i) => (
          <RoomSkeletonCard key={i} />
        ))}
      </Animated.ScrollView>
    );
  }
  return (
    <Animated.FlatList
      data={data}
      refreshing={refreshing}
      onRefresh={onRefresh}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.listContent,
        { paddingTop: headerHeight, paddingHorizontal: Spacing.l },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false },
      )}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            icon={DoorOpen}
            title="No Rooms Found"
            description="Add rooms to your property to see them here."
          />
        ) : null
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.roomCard}
          onPress={() => onRoomPress(item)}
          activeOpacity={0.9}
        >
          {/* Top Row: Room Info */}
          <View style={styles.cardHeader}>
            <View style={styles.roomIconWrapper}>
              <DoorOpen size={24} color={Colors.primary} />
            </View>

            <View style={styles.roomInfo}>
              <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
              <Text style={styles.floorText}>{item.floor}</Text>
            </View>

            <View style={styles.tagsColumn}>
              <View style={styles.roomTypeTag}>
                <Text style={styles.roomTypeText}>{item.type}</Text>
              </View>
              {item.isAc && (
                <View
                  style={[styles.roomTypeTag, { backgroundColor: "#e0f2fe" }]}
                >
                  <Text style={[styles.roomTypeText, { color: "#0284c7" }]}>
                    AC
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Bottom Row: Beds */}
          <View style={styles.bedsContainer}>
            {item.beds.map((bed: any, index: number) => (
              <View key={bed.id} style={styles.bedWrapper}>
                <Text style={styles.bedLabel}>{index + 1}</Text>
                <Bed
                  size={28}
                  color={bed.status === "occupied" ? "#d1d5db" : "#22c55e"}
                  fill={bed.status === "occupied" ? "#d1d5db" : "#22c55e"}
                />
              </View>
            ))}
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
    gap: Spacing.l,
  },
  skeletonCard: {
    backgroundColor: Colors.white,
    padding: Spacing.l,
    borderRadius: 24,
    gap: Spacing.m,
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
  skeletonHeader: {
    flexDirection: "row",
    gap: Spacing.m,
    alignItems: "center",
  },
  roomCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.l,
    gap: Spacing.m,
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    justifyContent: "space-between",
  },
  roomIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: Spacing.m,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  roomInfo: {
    flex: 1,
    gap: 2,
  },
  roomNumber: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
  },
  floorText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
  },
  roomTypeTag: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Spacing.s,
    alignSelf: "flex-end",
  },
  tagsColumn: {
    alignItems: "flex-end",
    gap: 4,
  },
  roomTypeText: {
    fontSize: Typography.size.s,
    color: Colors.textSecondary,
    fontFamily: Typography.font.medium,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    width: "100%",
  },
  bedsContainer: {
    flexDirection: "row",
    gap: Spacing.xl,
    paddingTop: Spacing.xs,
    justifyContent: "center",
  },
  bedWrapper: {
    alignItems: "center",
    gap: 4,
  },
  bedLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontFamily: Typography.font.medium,
  },
});
