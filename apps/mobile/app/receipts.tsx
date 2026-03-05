import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ReceiptsHeader } from "@/components/resident/ReceiptsHeader";
import { ReceiptsList, ResidentReceipt } from "@/components/resident/ReceiptsList";
import { Spacing } from "@/constants/Spacing";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useResident } from "@/context/ResidentContext";
import {
  addMonths,
  format,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";

export default function ResidentReceiptsScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;

  const [startDate, setStartDate] = useState(() => startOfDay(new Date()));
  const [endDate, setEndDate] = useState(() => startOfDay(new Date()));
  const { residentProfile, refetch } = useResident();
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    if (!residentProfile) return;
    setStartDate(startOfDay(new Date(residentProfile.checkInDate)));
    setEndDate(
      residentProfile.lastPaymentDate
        ? startOfDay(new Date(residentProfile.lastPaymentDate))
        : startOfDay(new Date()),
    );
  }, [residentProfile]);

  // Generate synthetic receipts
  // TODO: Replace this with actual queries when a `payments` table is added to the database.
  const receipts: ResidentReceipt[] = React.useMemo(() => {
    if (!residentProfile) return [];
    if (!residentProfile.lastPaymentDate) return [];

    const generated: ResidentReceipt[] = [];
    const checkIn = startOfDay(new Date(residentProfile.checkInDate));
    const lastPayment = startOfDay(new Date(residentProfile.lastPaymentDate));
    let currentDate = checkIn;
    let i = 1;

    while (!isAfter(currentDate, lastPayment)) {
      if (
        !isBefore(currentDate, startOfDay(startDate)) &&
        !isBefore(startOfDay(endDate), currentDate)
      ) {
        generated.push({
          id: `r-${i}`,
          name: residentProfile.name,
          room: `Room ${residentProfile.room.roomNumber}`,
          date: format(currentDate, "dd MMM, yyyy"),
          time: "10:00 AM", // Synthetic time
          amount: residentProfile.rentAmount,
        });
      }

      currentDate = addMonths(currentDate, 1);
      i++;
    }

    return generated.reverse();
  }, [residentProfile, startDate, endDate]);

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
