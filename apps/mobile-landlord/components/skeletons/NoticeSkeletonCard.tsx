import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import React from "react";
import { StyleSheet, View } from "react-native";

export function NoticeSkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      {/* Header: Icon + Info + Badge */}
      <View style={styles.skeletonHeader}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={styles.headerInfo}>
          <SkeletonLoader width={100} height={20} borderRadius={4} />
          <SkeletonLoader width={60} height={14} borderRadius={4} />
        </View>
        <SkeletonLoader width={60} height={24} borderRadius={12} />
      </View>

      {/* Body: Text */}
      <View style={{ gap: 8 }}>
        <SkeletonLoader width="100%" height={16} borderRadius={4} />
        <SkeletonLoader width="90%" height={16} borderRadius={4} />
        <SkeletonLoader width="40%" height={16} borderRadius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonCard: {
    backgroundColor: Colors.white,
    padding: Spacing.l,
    borderRadius: 24,
    gap: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  skeletonHeader: {
    flexDirection: "row",
    gap: Spacing.m,
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
});
