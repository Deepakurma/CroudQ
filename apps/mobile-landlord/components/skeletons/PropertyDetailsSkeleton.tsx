import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function PropertyDetailsSkeleton() {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;

  return (
    <View style={[styles.container, { paddingTop: headerHeight }]}>
      {/* Header Card Skeleton */}
      <View style={styles.headerCard}>
        <SkeletonLoader
          style={{ marginLeft: "auto" }}
          width={150}
          height={40}
          borderRadius={24}
        />
        <View
          style={{
            flexDirection: "column",
            gap: Spacing.s,
          }}
        >
          <SkeletonLoader width={150} height={24} borderRadius={4} />
          <SkeletonLoader width={100} height={24} borderRadius={4} />
        </View>
      </View>

      {/* Contact Skeleton */}
      <View style={styles.card}>
        <SkeletonLoader width="100%" height={80} borderRadius={Spacing.xl} />
      </View>

      {/* Address Skeleton */}
      <View style={styles.card}>
        <View
          style={{
            flexDirection: "row",
            gap: Spacing.s,
          }}
        >
          <SkeletonLoader width={24} height={24} borderRadius={12} />
          <SkeletonLoader width={100} height={24} borderRadius={4} />
        </View>
        <SkeletonLoader width="80%" height={20} borderRadius={4} />
        <SkeletonLoader width="60%" height={20} borderRadius={4} />
      </View>

      {/* Stats Row Skeleton */}
      <View style={styles.statsRow}>
        {[1, 2, 3].map((_, index) => (
          <View key={index} style={styles.statCard}>
            <SkeletonLoader width={40} height={32} borderRadius={4} />
            <SkeletonLoader width={60} height={16} borderRadius={4} />
          </View>
        ))}
      </View>

      {[1, 2].map((_, index) => (
        <View key={index} style={styles.card}>
          <SkeletonLoader width="80%" height={20} borderRadius={4} />
          <SkeletonLoader width="60%" height={20} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.l,
    gap: Spacing.l,
  },
  headerCard: {
    justifyContent: "space-between",
    height: 200,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.m,
  },
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.m,
    borderRadius: 24,
    gap: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    padding: Spacing.m,
    borderRadius: 24,
    gap: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
});
