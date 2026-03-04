import { ResidentCard } from "@/components/ResidentCard";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { RoomsFilterSheet } from "@/components/rooms/RoomsFilterSheet";
import { RoomsHeader } from "@/components/rooms/RoomsHeader";
import { RoomsList } from "@/components/rooms/RoomsList";
import { ResidentSkeletonCard } from "@/components/skeletons/ResidentSkeletonCard";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useRoomsFilter } from "@/context/FilterContext";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React, { useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { trpc } from "@/utils/api";
import { EmptyState } from "@/components/EmptyState";
import { format } from "date-fns";
import { useProperty } from "@/context/PropertyContext";

export default function Page() {
  const { selectedPropertyId } = useProperty();
  const { status: roomsStatus, setStatus: setRoomsStatus } = useRoomsFilter();
  const uiFilter: "All" | "Available" | "Occupied" =
    roomsStatus === "all"
      ? "All"
      : roomsStatus === "available"
        ? "Available"
        : "Occupied";

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: fetchedRooms,
    isLoading,
    isFetching,
    refetch,
  } = trpc.property.getRooms.useQuery({
    status: roomsStatus,
    q: debouncedSearch || undefined,
  }, {
    enabled: !!selectedPropertyId,
    placeholderData: (previousData) => previousData,
  });
  const rooms = useMemo(() => {
    if (!fetchedRooms) return [];
    return fetchedRooms.map((room) => {
      const capacity = room.totalCapacity || 1;
      const occupancy = room.currentOccupancy || 0;
      const beds = Array.from({ length: capacity }, (_, i) => ({
        id: `${room.id}-bed-${i}`,
        status: (i < occupancy ? "occupied" : "vacant") as
          | "occupied"
          | "vacant",
      }));
      return { ...room, beds };
    });
  }, [fetchedRooms]);

  // Filter State
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedAc, setSelectedAc] = useState<boolean | null>(null);

  const availableFloors = useMemo(() => {
    const unique = Array.from(new Set(rooms.map((room) => room.floor)));
    return unique.sort((a, b) => {
      const floorOrder = (value: string) => {
        if (value.toLowerCase() === "ground") return 0;
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
      };
      return floorOrder(a) - floorOrder(b);
    });
  }, [rooms]);

  const availableRoomTypes = useMemo(() => {
    return Array.from(new Set(rooms.map((room) => room.type))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [rooms]);

  React.useEffect(() => {
    if (selectedFloor && !availableFloors.includes(selectedFloor)) {
      setSelectedFloor(null);
    }
  }, [availableFloors, selectedFloor]);

  React.useEffect(() => {
    if (selectedType && !availableRoomTypes.includes(selectedType)) {
      setSelectedType(null);
    }
  }, [availableRoomTypes, selectedType]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const residentsBottomSheetRef = useRef<BottomSheetModal>(null);

  // Residents Data State
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Fetch residents for selected room
  const { data: fetchedResidents, isLoading: isLoadingResidents } =
    trpc.resident.getResidentsByRoom.useQuery(
      { roomId: selectedRoomId || "" },
      { enabled: !!selectedRoomId },
    );

  const handleRoomPress = (room: any) => {
    setSelectedRoomNumber(room.roomNumber);
    setSelectedRoomId(room.id);
    residentsBottomSheetRef.current?.present();
  };

  const handleOpenFilters = () => {
    bottomSheetRef.current?.present();
  };

  const handleApplyFilters = () => {
    bottomSheetRef.current?.dismiss();
  };

  const handleResetFilters = () => {
    setSelectedFloor(null);
    setSelectedType(null);
    setSelectedAc(null);
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesFloor = selectedFloor ? room.floor === selectedFloor : true;
    const matchesType = selectedType ? room.type === selectedType : true;
    const matchesAc = selectedAc !== null ? room.isAc === selectedAc : true;

    return matchesFloor && matchesType && matchesAc;
  });

  return (
    <ScreenWrapper title="Rooms" scrollY={scrollY}>
      <View style={styles.container}>
        <RoomsFilterSheet
          ref={bottomSheetRef}
          selectedFloor={selectedFloor}
          setSelectedFloor={setSelectedFloor}
          availableFloors={availableFloors}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          availableRoomTypes={availableRoomTypes}
          selectedAc={selectedAc}
          setSelectedAc={setSelectedAc}
          onReset={handleResetFilters}
          onApply={handleApplyFilters}
        />

        {/* Residents Bottom Sheet */}
        <AppBottomSheet
          ref={residentsBottomSheetRef}
          enableDynamicSizing={true}
          contentContainerStyle={{
            paddingBottom: 30,
          }}
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              Room {selectedRoomNumber} Residents
            </Text>
          </View>
          <View style={{ gap: Spacing.l }}>
            {isLoadingResidents ? (
              <View style={{ gap: Spacing.m }}>
                {[1, 2].map((i) => (
                  <ResidentSkeletonCard key={i} />
                ))}
              </View>
            ) : (
              fetchedResidents?.map((resident) => {
                // Adapt resident data for ResidentCard if needed
                // ResidentCard expects: id, name, room, dateCheckedIn, roomType, isAc, contact, rentAmount
                // fetchedResidents has: id, name, phoneNumber, checkInDate, rentAmount, etc.
                // We need to map it.
                // dateCheckedIn needs formatting.
                const checkInDate = new Date(resident.checkInDate);
                const formattedDate = `${String(checkInDate.getDate()).padStart(2, "0")}/${String(checkInDate.getMonth() + 1).padStart(2, "0")}/${checkInDate.getFullYear()}`;

                let formattedCheckOutDate = undefined;
                if (resident.checkOutDate) {
                  const checkOutDate = new Date(resident.checkOutDate);
                  formattedCheckOutDate = `${String(checkOutDate.getDate()).padStart(2, "0")}/${String(checkOutDate.getMonth() + 1).padStart(2, "0")}/${checkOutDate.getFullYear()}`;
                }

                // Get room details from 'rooms' state or we assume them from context?
                // We can find the room in 'rooms' state using selectedRoomId
                const roomDetails = rooms.find((r) => r.id === selectedRoomId);

                const formattedNextRentDate = format(
                  new Date(resident.nextRentDueDate),
                  "dd/MM/yyyy",
                );

                return (
                  <ResidentCard
                    key={resident.id}
                    item={{
                      id: resident.id,
                      name: resident.name,
                      room: roomDetails?.roomNumber || selectedRoomNumber,
                      dateCheckedIn: formattedDate,
                      dateCheckedOut: formattedCheckOutDate,
                      roomType: roomDetails?.type || "Unknown",
                      isAc: roomDetails?.isAc || false,
                      primaryPhone: resident.phoneNumber,
                      profileImage: resident.profileImage || undefined,
                      rentAmount: resident.rentAmount,
                      advanceMonths: resident.advanceMonths || 0,
                      upcomingRentDate: formattedNextRentDate,
                    }}
                  />
                );
              })
            )}
          </View>
          {!isLoadingResidents &&
            (!fetchedResidents || fetchedResidents.length === 0) && (
              <EmptyState description="Room is empty"></EmptyState>
            )}
        </AppBottomSheet>

        <RoomsList
          data={filteredRooms}
          scrollY={scrollY}
          headerHeight={headerHeight}
          onRoomPress={handleRoomPress}
          isLoading={isLoading && !rooms.length}
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          ListHeaderComponent={
            <RoomsHeader
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filter={uiFilter}
              setFilter={(next) =>
                setRoomsStatus(
                  next === "All"
                    ? "all"
                    : next === "Available"
                      ? "available"
                      : "occupied",
                )
              }
              onOpenFilters={handleOpenFilters}
            />
          }
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
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  sheetTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.font.bold,
    color: Colors.text,
  },
});
