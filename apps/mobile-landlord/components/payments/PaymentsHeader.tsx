import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { formatIndianCurrency } from "@/utils/common";
import { Search, X } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { DatePicker } from "@/components/ui/DatePicker";
import { CardShadow } from "@/constants/Shadows";

interface PaymentsHeaderProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  rentsExpected: number;
  rentsReceived: number;
}

export function PaymentsHeader({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  rentsExpected,
  rentsReceived,
}: PaymentsHeaderProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <View style={{ gap: Spacing.l }}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textSecondary} />
        <TextInput
          placeholder="Search by room or name"
          style={styles.searchInput}
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {!!searchQuery && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <X size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

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

      {/* Revenue Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Rents Expected</Text>
          <Text style={styles.statValue}>
            {formatIndianCurrency(rentsExpected)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Rents Received</Text>
          <Text style={styles.statValue}>
            {formatIndianCurrency(rentsReceived)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.l,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    ...CardShadow,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.s,
    fontSize: 14,
    color: Colors.text,
    fontFamily: Typography.font.regular,
  },
  clearButton: {
    padding: 6,
    marginLeft: Spacing.s,
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
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.accent,
    borderRadius: Spacing.xl,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s + 2,
  },
  dateText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
    color: Colors.text,
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white, // Light grey/accent
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    ...CardShadow,
    elevation: 1,
  },
  statLabel: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.bold,
    color: Colors.primary,
  },
});
