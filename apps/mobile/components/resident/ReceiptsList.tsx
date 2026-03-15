import { Colors } from "@/constants/Colors";
import { CardShadow } from "@/constants/Shadows";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { formatIndianCurrency } from "@/utils/common";
import React, { ReactElement } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export interface ResidentReceipt {
  id: string;
  name: string;
  room: string;
  date: string;
  time: string;
  amount: number | string;
}

interface ReceiptsListProps {
  data: ResidentReceipt[];
  scrollY: Animated.Value;
  headerHeight: number;
  ListHeaderComponent?: ReactElement;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ReceiptsList({
  data,
  scrollY,
  headerHeight,
  ListHeaderComponent,
  refreshing,
  onRefresh,
}: ReceiptsListProps) {
  return (
    <Animated.FlatList
      data={data}
      refreshing={refreshing}
      onRefresh={onRefresh}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { paddingTop: headerHeight }]}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false },
      )}
      ListHeaderComponent={ListHeaderComponent}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.nameColumn}>
              <Text style={styles.nameText}>{item.name}</Text>
              <Text style={styles.roomText}>{item.room}</Text>
            </View>
            <View style={styles.dateTimeColumn}>
              <Text style={styles.dateDisplay}>{item.date}</Text>
              <Text style={styles.timeDisplay}>{item.time}</Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount Paid</Text>
            <Text style={styles.amountText}>
              {formatIndianCurrency(item.amount)}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: Spacing.l,
    gap: Spacing.l,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: Spacing.l,
    gap: Spacing.s,
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
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameColumn: {
    flex: 1,
    gap: 4,
  },
  nameText: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
  },
  roomText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  dateTimeColumn: {
    alignItems: "flex-end",
    gap: 4,
  },
  dateDisplay: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
  },
  timeDisplay: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
  },
  amountRow: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.s,
    borderTopWidth: 1,
    borderTopColor: Colors.accent,
  },
  amountLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  amountText: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: Colors.success,
  },
});
