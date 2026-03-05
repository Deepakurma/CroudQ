import { DatePicker } from "@/components/ui/DatePicker";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ReceiptsHeaderProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}

export function ReceiptsHeader({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: ReceiptsHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.dateRangeContainer}>
        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateLabel}>From</Text>
          <DatePicker
            value={startDate}
            onChange={onStartDateChange}
            placeholder="Start Date"
          />
        </View>
        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateLabel}>To</Text>
          <DatePicker
            value={endDate}
            onChange={onEndDateChange}
            placeholder="End Date"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.l,
  },
  dateRangeContainer: {
    flexDirection: "row",
    gap: Spacing.m,
    justifyContent: "space-between",
  },
  dateInputWrapper: {
    flex: 1,
    gap: 6,
  },
  dateLabel: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
});
