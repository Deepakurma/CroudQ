import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import React from "react";
import { StyleSheet, View } from "react-native";

export function ResidentSkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      {/* Header: Avatar + Info */}
      <View style={styles.skeletonHeader}>
        <SkeletonLoader width={48} height={48} borderRadius={24} />
        <View style={{ gap: 8 }}>
          <SkeletonLoader width={150} height={20} borderRadius={4} />
          <SkeletonLoader width={120} height={20} borderRadius={8} />
        </View>
      </View>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: Colors.border,
          width: "100%",
        }}
      />

      {/* Footer Actions */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingTop: 4,
        }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <SkeletonLoader width={150} height={30} borderRadius={18} />
        </View>
        <SkeletonLoader width={80} height={30} borderRadius={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonCard: {
    backgroundColor: Colors.white,
    padding: Spacing.m,
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
});
