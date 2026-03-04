import { Spacing } from "@/constants/Spacing";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SkeletonLoader } from "../ui/SkeletonLoader";

interface BedPillSkeletonProps {
  labelWidth?: number;
}

export function BedPillSkeleton({ labelWidth = 70 }: BedPillSkeletonProps) {
  return (
    <View style={styles.bedPillContent}>
      <SkeletonLoader width={40} height={40} borderRadius={8} />
      <View>
        <SkeletonLoader width={40} height={24} style={{ marginBottom: 4 }} />
        <SkeletonLoader width={labelWidth} height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bedPillContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
});
