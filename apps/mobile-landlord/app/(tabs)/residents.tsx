import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ResidentsHeader } from "@/components/residents/ResidentsHeader";
import { ResidentsList } from "@/components/residents/ResidentsList";
import { useResidentsFilter } from "@/context/FilterContext";
import { trpc } from "@/utils/api";
import { format } from "date-fns";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProperty } from "@/context/PropertyContext";

export default function Page() {
  const { selectedPropertyId } = useProperty();
  const { status: residentsStatus, setStatus: setResidentsStatus } =
    useResidentsFilter();
  const uiFilter: "All" | "Pending Checkouts" =
    residentsStatus === "pending_checkout" ? "Pending Checkouts" : "All";
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: residentsData,
    isLoading,
    isFetching,
    refetch,
  } = trpc.resident.list.useQuery(
    {
      status: residentsStatus,
      q: debouncedSearch || undefined,
      scopePropertyId: selectedPropertyId || undefined,
    },
    {
      enabled: !!selectedPropertyId,
      placeholderData: (previousData) => previousData,
    },
  );
  const { data: pendingCheckoutResidents } = trpc.resident.list.useQuery(
    {
      status: "pending_checkout",
      limit: 1,
      scopePropertyId: selectedPropertyId || undefined,
    },
    {
      enabled: !!selectedPropertyId,
      placeholderData: (previousData) => previousData,
    },
  );
  const hasPendingCheckouts = (pendingCheckoutResidents?.length ?? 0) > 0;

  const mappedResidents = residentsData?.map((r) => {
    const formattedDate = format(new Date(r.checkInDate), "dd/MM/yyyy");

    const formattedCheckOutDate = r.checkOutDate
      ? format(new Date(r.checkOutDate), "dd/MM/yyyy")
      : undefined;

    const formattedNextRentDate = format(
      new Date(r.nextRentDueDate),
      "dd/MM/yyyy",
    );

    return {
      id: r.id,
      name: r.name,
      room: r.room?.roomNumber || "N/A",
      dateCheckedIn: formattedDate,
      dateCheckedOut: formattedCheckOutDate,
      roomType: r.room?.type?.name || "N/A",
      isAc: r.room?.ac || false,
      primaryPhone: r.phoneNumber,
      profileImage: r.profileImage || undefined,
      rentAmount: r.rentAmount,
      advanceMonths: r.advanceMonths || 0,
      upcomingRentDate: formattedNextRentDate, // Correctly mapped to next rent due date
    };
  });

  return (
    <ScreenWrapper title="Residents" scrollY={scrollY}>
      <View style={styles.container}>
        <ResidentsList
          data={mappedResidents || []}
          scrollY={scrollY}
          headerHeight={headerHeight}
          ListHeaderComponent={
            <ResidentsHeader
              filter={uiFilter}
              setFilter={(next) =>
                setResidentsStatus(
                  next === "Pending Checkouts" ? "pending_checkout" : "all",
                )
              }
              hasPendingCheckouts={hasPendingCheckouts}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          }
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          isLoading={isLoading && !residentsData}
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
