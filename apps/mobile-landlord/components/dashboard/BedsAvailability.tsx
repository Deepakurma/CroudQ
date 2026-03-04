import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useRouter } from "expo-router";
import { BedDouble, ChevronDown, ChevronRight } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BedPillSkeleton } from "../skeletons/BedPillSkeleton";
import { Colors } from "@/constants/Colors";

export interface BedsAvailabilityProps {
  emptyBeds: number;
  occupiedBeds: number;
  isLoading?: boolean;
  onEmptyBedsPress?: () => void;
  onOccupiedBedsPress?: () => void;
}

export function BedsAvailability({
  emptyBeds = 0,
  occupiedBeds = 0,
  isLoading = false,
  onEmptyBedsPress,
  onOccupiedBedsPress,
}: BedsAvailabilityProps) {
  const router = useRouter();
  return (
    <View style={styles.bedsRow}>
      <TouchableOpacity
        style={[styles.bedPill, styles.emptyBedsPill]}
        onPress={() =>
          onEmptyBedsPress ? onEmptyBedsPress() : router.push("/rooms" as any)
        }
      >
        {isLoading ? (
          <BedPillSkeleton labelWidth={70} />
        ) : (
          <>
            <View style={styles.bedPillContent}>
              <View style={[styles.bedIconPlaceholder, styles.emptyBedsIconBg]}>
                <BedDouble color="#0040d6" />
              </View>
              <View>
                <Text style={styles.bedNumber}>{emptyBeds}</Text>
                <Text style={styles.bedLabel}>Empty Beds</Text>
              </View>
            </View>
            <ChevronRight size={Spacing.l} color="#0040d6" />
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.bedPill, styles.occupiedBedsPill]}
        onPress={() =>
          onOccupiedBedsPress ? onOccupiedBedsPress() : router.push("/rooms" as any)
        }
      >
        {isLoading ? (
          <BedPillSkeleton labelWidth={85} />
        ) : (
          <>
            <View style={styles.bedPillContent}>
              <View style={[styles.bedIconPlaceholder, styles.emptyBedsIconBg]}>
                <BedDouble color="#e1c300" />
              </View>
              <View>
                <Text style={styles.bedNumber}>{occupiedBeds}</Text>
                <Text style={styles.bedLabel}>Occupied Beds</Text>
              </View>
            </View>
            <ChevronDown
              size={Spacing.l}
              color="#e1c300"
              style={{ transform: [{ rotate: "-90deg" }] }}
            />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bedsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.l,
  },
  bedPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.s,
    padding: Spacing.m,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyBedsPill: {
    backgroundColor: "#cadaf9",
    borderColor: "#b8cef6",
  },
  occupiedBedsPill: {
    backgroundColor: "#f1e282",
    borderColor: "#ecdb67",
  },
  bedPillContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  bedIconPlaceholder: {
    padding: 5,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyBedsIconBg: {
    backgroundColor: Colors.white,
  },
  bedNumber: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.bold,
    color: "#2f3a4a",
  },
  bedLabel: {
    fontSize: Typography.size.xs,
    color: "#5b6678",
    fontFamily: Typography.font.regular,
  },
});
