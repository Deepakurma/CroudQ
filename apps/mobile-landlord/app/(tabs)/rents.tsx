import { ScreenWrapper } from "@/components/ScreenWrapper";
import { RentsHeader } from "@/components/rents/RentsHeader";
import { RentsList } from "@/components/rents/RentsList";
import { useRentsFilter } from "@/context/FilterContext";
import React, { useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { trpc } from "@/utils/api";
import { format, isBefore, startOfDay } from "date-fns";
import { useProperty } from "@/context/PropertyContext";

export default function Page() {
  const { selectedPropertyId } = useProperty();
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;
  const { status: rentsStatus, setStatus: setRentsStatus } = useRentsFilter();
  const uiFilter: "Due" | "Paid" = rentsStatus === "due" ? "Due" : "Paid";
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: residents, isLoading, isFetching, refetch } =
    trpc.resident.list.useQuery(
      {
        status: rentsStatus,
        q: debouncedSearch || undefined,
        scopePropertyId: selectedPropertyId || undefined,
      },
      {
        enabled: !!selectedPropertyId,
        placeholderData: (previousData) => previousData,
      },
    );

  const today = startOfDay(new Date());

  const filteredResidents = (residents || [])
    .map((r) => {
      const nextRentDueDate = new Date(r.nextRentDueDate);
      // Determine Status:
      // If Today is BEFORE the due date -> Not Due Yet (Considered "Paid" contextually or "Upcoming")
      // If Today is ON or AFTER the due date -> Due

      // However, we only have "Paid" and "Due" filters.
      // "Due" means rent is currently claimable.
      // "Paid" generally means they are good until the next due date.

      // Using simplistic logic as requested:
      // If today < nextRentDueDate -> Paid
      // If today >= nextRentDueDate -> Due

      const isDue = !isBefore(today, nextRentDueDate);

      const datePaid = r.lastPaymentDate
        ? format(new Date(r.lastPaymentDate), "dd MMM yyyy")
        : "-";
      const dateDue = format(nextRentDueDate, "dd MMM yyyy");

      return {
        id: r.id,
        name: r.name,
        room: r.room?.roomNumber || "N/A",
        dateCheckedIn: format(new Date(r.checkInDate), "dd MMM, yyyy"),
        roomType: r.room?.type?.name || "N/A",
        isAc: r.room?.ac || false,
        primaryPhone: r.phoneNumber,
        rentAmount: r.rentAmount,
        advanceMonths: r.advanceMonths,
        rentStatus: isDue ? "Due" : "Paid",
        paymentDate: datePaid,
        dueDate: dateDue,
        upcomingRentDate: dateDue, // Same as due date
        nextRentDueDate: nextRentDueDate.toISOString(), // Keep raw for logic if needed
        profileImage: r.profileImage || undefined,
      };
    });

  return (
    <ScreenWrapper title="Rents" scrollY={scrollY}>
      <View style={styles.container}>
        <RentsList
          data={filteredResidents}
          scrollY={scrollY}
          headerHeight={headerHeight}
          ListHeaderComponent={
            <RentsHeader
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filter={uiFilter}
              setFilter={(next) =>
                setRentsStatus(next === "Due" ? "due" : "paid")
              }
            />
          }
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          isLoading={isLoading && !residents}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
