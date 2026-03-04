import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ResidentsHeader } from "@/components/residents/ResidentsHeader";
import { ResidentsList } from "@/components/residents/ResidentsList";
import { trpc } from "@/utils/api";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProperty } from "@/context/PropertyContext";

export default function CheckoutsPage() {
  const { selectedPropertyId } = useProperty();
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: checkoutsData,
    isLoading,
    isFetching,
    refetch,
  } = trpc.resident.listCheckouts.useQuery(
    {
      q: debouncedSearch || undefined,
      scopePropertyId: selectedPropertyId || undefined,
    },
    {
      enabled: !!selectedPropertyId,
      placeholderData: (previousData) => previousData,
    },
  );

  const mappedResidents = checkoutsData?.map((r) => {
    const checkInDate = new Date(r.checkInDate);
    const formattedDate = `${String(checkInDate.getDate()).padStart(2, "0")}/${String(checkInDate.getMonth() + 1).padStart(2, "0")}/${checkInDate.getFullYear()}`;

    const checkOutDate = new Date(r.checkOutDate);
    const formattedCheckOutDate = `${String(checkOutDate.getDate()).padStart(2, "0")}/${String(checkOutDate.getMonth() + 1).padStart(2, "0")}/${checkOutDate.getFullYear()}`;

    return {
      id: r.id,
      name: r.name,
      room: r.roomNumber,
      dateCheckedIn: formattedDate,
      dateCheckedOut: formattedCheckOutDate,
      roomType: r.roomType || "N/A",
      isAc: r.isAc || false,
      primaryPhone: r.phoneNumber,
      profileImage: r.profileImage || undefined,
      rentAmount: r.rentAmount,
      advanceMonths: 0,
      upcomingRentDate: formattedCheckOutDate, // Showing checkout date as relevant date
    };
  });

  return (
    <ScreenWrapper title="Checkouts" scrollY={scrollY}>
      <View style={styles.container}>
        <ResidentsList
          data={mappedResidents || []}
          scrollY={scrollY}
          headerHeight={headerHeight}
          ListHeaderComponent={
            <ResidentsHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          }
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          isLoading={isLoading && !checkoutsData}
          readonly={true}
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
