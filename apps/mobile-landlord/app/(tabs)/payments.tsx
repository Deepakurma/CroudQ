import { ScreenWrapper } from "@/components/ScreenWrapper";
import { PaymentsHeader } from "@/components/payments/PaymentsHeader";
import { PaymentsList } from "@/components/payments/PaymentsList";
import { Spacing } from "@/constants/Spacing";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAYMENTS = [
  {
    id: "1",
    name: "Amar Salve",
    room: "Room 205",
    date: "12 Dec, 2023",
    time: "10:30 AM",
    amount: 5000,
  },
  {
    id: "2",
    name: "Rohan Sharma",
    room: "Room 102",
    date: "11 Dec, 2023",
    time: "09:15 AM",
    amount: 7500,
  },
  {
    id: "3",
    name: "Vikram Singh",
    room: "Room 304",
    date: "10 Dec, 2023",
    time: "04:45 PM",
    amount: 4000,
  },
  {
    id: "4",
    name: "Amit Patel",
    room: "Room 201",
    date: "09 Dec, 2023",
    time: "02:00 PM",
    amount: 6000,
  },
  {
    id: "5",
    name: "Suresh Kumar",
    room: "Room 105",
    date: "08 Dec, 2023",
    time: "11:20 AM",
    amount: 5000,
  },
];

export default function Page() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;

  const [startDate, setStartDate] = useState(new Date(2023, 11, 1));
  const [endDate, setEndDate] = useState(new Date(2023, 11, 31));
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  React.useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);
  /* REMOVED: Old Date Picker Logic */
  /*
  const [pickerMode, setPickerMode] = useState<"start" | "end" | null>(null);

  const formatDate = (date: Date) => {
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, " / ");
  };
  */

  // New DatePicker component handles string formatting internally for display,
  // but PaymentsHeader expects `formatDate` function and specific props.
  // Wait, PaymentsHeader is a custom component. Let's see how it uses these props.
  // If I change PaymentsHeader signature, I need to check that file too.
  // For now, I will modify this file to render DatePicker directly if possible, OR
  // I might need to refactor PaymentsHeader to accept DatePicker components or similar.
  // Let's look at `PaymentsHeader` usage. It has `onStartDatePress` and `onEndDatePress`.
  // The `DatePicker` component I made renders an input that opens the picker.
  // I should probably pass the usage of DatePicker *into* PaymentsHeader or replace PaymentsHeader logic.
  // Let's first check PaymentsHeader.tsx.

  return (
    <ScreenWrapper title="Payments" scrollY={scrollY}>
      <View style={styles.container}>
        <PaymentsList
          data={PAYMENTS}
          scrollY={scrollY}
          headerHeight={headerHeight}
          ListHeaderComponent={
            <PaymentsHeader
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              rentsExpected={150000} // Mock value for now
              rentsReceived={PAYMENTS.reduce(
                (sum, item) => sum + item.amount,
                0,
              )}
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  pickerContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  iosPicker: {
    height: 200,
  },
});
