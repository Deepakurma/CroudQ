import { ComplaintSkeletonCard } from "@/components/skeletons/ComplaintSkeletonCard";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { CheckCircle2, ClipboardX, DoorOpen } from "lucide-react-native";
import React, { ReactElement } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EmptyState } from "../EmptyState";

export interface Complaint {
  id: string;
  roomNumber: string;
  floor: string;
  date: string;
  description: string;
  status: "Resolved" | "Unresolved";
}

interface ComplaintsListProps {
  data: Complaint[];
  scrollY: Animated.Value;
  headerHeight: number;
  ListHeaderComponent: ReactElement;
  onResolve: (id: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function ComplaintsList({
  data,
  scrollY,
  headerHeight,
  ListHeaderComponent,
  onResolve,
  refreshing,
  onRefresh,
  isLoading,
}: ComplaintsListProps) {
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
          <ComplaintSkeletonCard key={i} />
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
      renderItem={({ item }) => (
        <View style={styles.card}>
          {/* Section 1: Header (Room & Floor) */}
          <View style={styles.cardSection}>
            <View style={styles.rowBetween}>
              <View style={styles.roomInfo}>
                <View style={styles.iconBox}>
                  <DoorOpen size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
                  <Text style={styles.floorText}>{item.floor}</Text>
                </View>
              </View>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Section 2: Description */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionLabel}>ISSUE DESCRIPTION</Text>
            <Text style={styles.descriptionText} numberOfLines={3}>
              {item.description}
            </Text>
          </View>

          {/* Section 3: Action Button */}
          <View style={[styles.cardSection, { paddingBottom: 0 }]}>
            {item.status === "Resolved" ? (
              <View style={styles.resolvedBadge}>
                <CheckCircle2 size={16} color="#15803d" />
                <Text style={styles.resolvedText}>Resolved</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.resolveBtn}
                onPress={() => onResolve(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            icon={ClipboardX}
            title="No Complaints"
            description="All clear! No complaints found."
          />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
    gap: Spacing.l,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.l,
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
  cardSection: {
    paddingVertical: Spacing.xs,
    gap: Spacing.s,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.s,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomInfo: {
    flexDirection: "row",
    gap: Spacing.m,
    alignItems: "center",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  roomNumber: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
  },
  floorText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  dateText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
  },
  sectionLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.bold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.regular,
    color: Colors.text,
    lineHeight: 22,
  },
  resolveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.s,
    borderRadius: Spacing.l,
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  resolveBtnText: {
    color: Colors.white,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
  },
  resolvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.s,
    backgroundColor: "#dcfce7",
    borderRadius: Spacing.l,
    marginTop: Spacing.xs,
  },
  resolvedText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: "#15803d",
  },
});
