import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import React from "react";
import { StyleSheet, View } from "react-native";

export function ComplaintSkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      {/* Header: Room Info + Date */}
      <View style={styles.skeletonHeader}>
        <View style={styles.roomInfo}>
          <SkeletonLoader width={40} height={40} borderRadius={12} />
          <View style={{ gap: 4 }}>
            <SkeletonLoader width={80} height={20} borderRadius={4} />
            <SkeletonLoader width={40} height={14} borderRadius={4} />
          </View>
        </View>
        <SkeletonLoader width={80} height={16} borderRadius={4} />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Body: Description */}
      <View style={{ gap: 8 }}>
        <SkeletonLoader width={100} height={14} borderRadius={4} />
        <SkeletonLoader width="100%" height={16} borderRadius={4} />
        <SkeletonLoader width="90%" height={16} borderRadius={4} />
        <SkeletonLoader width="60%" height={16} borderRadius={4} />
      </View>

      {/* Footer: Action Button */}
      <View style={{ marginTop: Spacing.s }}>
        <SkeletonLoader width="100%" height={40} borderRadius={Spacing.l} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonCard: {
    backgroundColor: Colors.white,
    padding: Spacing.l,
    borderRadius: 24,
    gap: Spacing.s,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  skeletonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomInfo: {
    flexDirection: "row",
    gap: Spacing.m,
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
});
