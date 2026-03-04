import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import React from "react";
import { StyleSheet, View } from "react-native";

export function PaymentSkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      {/* Header: Avatar + Info */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <SkeletonLoader width="30%" height={20} borderRadius={18} />
        <SkeletonLoader width="50%" height={20} borderRadius={18} />
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
      <SkeletonLoader width="100%" height={20} borderRadius={8} />
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
    justifyContent: "space-between",
  },
});
