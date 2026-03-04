import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ReceiptsHeader } from "@/components/tenant/ReceiptsHeader";
import { ReceiptsList, TenantReceipt } from "@/components/tenant/ReceiptsList";
import { Spacing } from "@/constants/Spacing";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTenant } from "@/context/TenantContext";
import {
  addMonths,
  format,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";

export default function TenantReceiptsScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;

  const [startDate, setStartDate] = useState(() => startOfDay(new Date()));
  const [endDate, setEndDate] = useState(() => startOfDay(new Date()));
  const { tenantProfile, refetch } = useTenant();
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    if (!tenantProfile) return;
    setStartDate(startOfDay(new Date(tenantProfile.checkInDate)));
    setEndDate(
      tenantProfile.lastPaymentDate
        ? startOfDay(new Date(tenantProfile.lastPaymentDate))
        : startOfDay(new Date()),
    );
  }, [tenantProfile]);

  // Generate synthetic receipts
  // TODO: Replace this with actual queries when a `payments` table is added to the database.
  const receipts: TenantReceipt[] = React.useMemo(() => {
    if (!tenantProfile) return [];
    if (!tenantProfile.lastPaymentDate) return [];

    const generated: TenantReceipt[] = [];
    const checkIn = startOfDay(new Date(tenantProfile.checkInDate));
    const lastPayment = startOfDay(new Date(tenantProfile.lastPaymentDate));
    let currentDate = checkIn;
    let i = 1;

    while (!isAfter(currentDate, lastPayment)) {
      if (
        !isBefore(currentDate, startOfDay(startDate)) &&
        !isBefore(startOfDay(endDate), currentDate)
      ) {
        generated.push({
          id: `r-${i}`,
          name: tenantProfile.name,
          room: `Room ${tenantProfile.room.roomNumber}`,
          date: format(currentDate, "dd MMM, yyyy"),
          time: "10:00 AM", // Synthetic time
          amount: tenantProfile.rentAmount,
        });
      }

      currentDate = addMonths(currentDate, 1);
      i++;
    }

    return generated.reverse();
  }, [tenantProfile, startDate, endDate]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <ScreenWrapper title="Receipts" scrollY={scrollY}>
      <View style={styles.container}>
        <ReceiptsList
          data={receipts}
          scrollY={scrollY}
          headerHeight={headerHeight}
          ListHeaderComponent={
            <ReceiptsHeader
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          }
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.l,
  },
});
