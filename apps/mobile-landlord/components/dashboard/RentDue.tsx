import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { trpc } from "@/utils/api";
import { format, isBefore, isSameDay } from "date-fns";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { EmptyState } from "../EmptyState";
import { useProperty } from "@/context/PropertyContext";

function RentItem({
  name,
  room,
  date,
}: {
  name: string;
  room: string | number;
  date: string;
}) {
  return (
    <View style={styles.rentItem}>
      <View style={styles.rentInfo}>
        <Text style={styles.rentName}>{name}</Text>
        <Text style={styles.rentRoom}>Room no - {room}</Text>
      </View>
      <Text style={styles.rentDate}>{date}</Text>
    </View>
  );
}

interface RentDueProps {
  onViewAllPress?: () => void;
}

export function RentDue({ onViewAllPress }: RentDueProps) {
  const router = useRouter();
  const { selectedPropertyId } = useProperty();

  const { data: residents } = trpc.resident.list.useQuery(
    {
      scopePropertyId: selectedPropertyId || undefined,
      status: "due",
      limit: 200,
    },
    {
      enabled: !!selectedPropertyId,
    },
  );

  const dueResidents = (residents || [])
    .filter((r) => {
      const dueDate = new Date(r.nextRentDueDate);
      const today = new Date();
      // Check if due date is today or in the past
      return isBefore(dueDate, today) || isSameDay(dueDate, today);
    })
    .map((r) => ({
      id: r.id,
      name: r.name,
      room: r.room?.roomNumber || "N/A",
      date: format(new Date(r.nextRentDueDate), "dd MMM, yyyy"),
    }))
    .slice(0, 5); // Limit to 5 items

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderSubRow}>
          <Text style={styles.sectionHeader}>Rent Due </Text>
          <Text style={styles.badgeCount}>
            {residents
              ? residents.filter((r) => {
                  const dueDate = new Date(r.nextRentDueDate);
                  const today = new Date();
                  return isBefore(dueDate, today) || isSameDay(dueDate, today);
                }).length
              : 0}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            onViewAllPress ? onViewAllPress() : router.push("/rents" as any)
          }
        >
          <View style={styles.viewAll}>
            <Text style={styles.viewAllText}>View all</Text>
            <ChevronRight color={Colors.textSecondary} size={Spacing.l} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.rentList}>
        {dueResidents.length > 0 ? (
          dueResidents.map((item, index) => (
            <View key={item.id}>
              <RentItem name={item.name} room={item.room} date={item.date} />
              {index !== dueResidents.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))
        ) : (
          <EmptyState description="No rent due"></EmptyState>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.l,
  },
  sectionHeader: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.bold,
    color: Colors.text,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeaderSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  badgeCount: {
    fontSize: Typography.size.m,
    color: Colors.textSecondary,
    fontFamily: Typography.font.regular,
  },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  viewAllText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
  },
  rentList: {
    gap: Spacing.s,
  },
  rentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    padding: Spacing.s,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.accent,
    marginLeft: Spacing.s,
  },
  rentInfo: {
    flex: 1,
  },
  rentName: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.text,
  },
  rentRoom: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: Typography.font.regular,
  },
  rentDate: {
    fontSize: 11,
    color: Colors.error,
    fontFamily: Typography.font.medium,
  },
});
