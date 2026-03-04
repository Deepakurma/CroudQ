import { ScreenWrapper } from "@/components/ScreenWrapper";
import { EditRoomSheet } from "@/components/manage-rooms/EditRoomSheet";
import { ManageRoomsFloorConfig } from "@/components/manage-rooms/ManageRoomsFloorConfig";
import { ManageRoomsHeader } from "@/components/manage-rooms/ManageRoomsHeader";
import { ManageRoomsList } from "@/components/manage-rooms/ManageRoomsList";
import { SeriesConfigSheet } from "@/components/manage-rooms/SeriesConfigSheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet"; // Keep type import
import React, { useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { trpc } from "@/utils/api";

import { AddRoomSheet } from "@/components/manage-rooms/AddRoomSheet";
import { useProperty } from "@/context/PropertyContext";

export default function ManageRoomsScreen() {
  const { selectedPropertyId } = useProperty();
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 60;

  // Fetch data
  const {
    data: fetchedRooms,
    isLoading,
    refetch,
  } = trpc.property.getRooms.useQuery(undefined, {
    enabled: !!selectedPropertyId,
  });
  const { data: fetchedRoomTypes } = trpc.property.getRoomTypes.useQuery(
    undefined,
    {
      enabled: !!selectedPropertyId,
    },
  );

  // State
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [selectedFloor, setSelectedFloor] = useState("All");
  const rooms = useMemo(() => fetchedRooms ?? [], [fetchedRooms]);

  // Use fetched types or fallback
  const sharingTypes = useMemo(() => {
    const defaultTypes = [
      "Single",
      "2-Sharing",
      "3-Sharing",
      "4-Sharing",
      "5-Sharing",
      "6-Sharing",
    ];

    if (fetchedRoomTypes && fetchedRoomTypes.length > 0) {
      // Collect names from backend
      // Also ensure defaults are present if not in backend?
      const backendNames = new Set(fetchedRoomTypes.map((t) => t.name));

      // Merge defaults that are missing from backend
      // or just show defaults + any extra from backend?
      // User wants "upto 6 sharing not just what user initially inputed"

      const combined = new Set([...defaultTypes, ...backendNames]);

      // Sort: try to extract number "2" from "2 Sharing" to sort properly
      return Array.from(combined).sort((a, b) => {
        const getNum = (s: string) => {
          if (s === "Single") return 1;
          const match = s.match(/(\d+)/);
          return match ? parseInt(match[1]) : 99;
        };
        return getNum(a) - getNum(b);
      });
    }
    return defaultTypes;
  }, [fetchedRoomTypes]);

  // Bottom Sheet
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // Edit State
  const [editType, setEditType] = useState<string | null>(null);
  const [editAc, setEditAc] = useState<boolean>(false);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editRoomNumber, setEditRoomNumber] = useState<string>("");

  const filteredRooms = useMemo(() => {
    if (selectedFloor === "All") return rooms;
    return rooms.filter((r) => r.floor === selectedFloor);
  }, [rooms, selectedFloor]);

  // Group by floor for the view
  const roomsByFloor = useMemo(() => {
    const groups: Record<string, typeof rooms> = {};
    filteredRooms.forEach((room) => {
      if (!groups[room.floor]) groups[room.floor] = [];
      groups[room.floor].push(room);
    });
    return groups;
  }, [filteredRooms]);

  const dynamicFloors = useMemo(() => {
    const unique = Array.from(new Set(rooms.map((r) => r.floor))).sort(
      (a, b) => {
        if (a === "Ground") return -1;
        if (b === "Ground") return 1;
        return a.localeCompare(b, undefined, { numeric: true });
      },
    );
    return unique;
  }, [rooms]);

  const toggleSelection = (id: string) => {
    setSelectedRoomIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      return [...prev, id];
    });
  };

  const clearSelection = () => {
    setSelectedRoomIds([]);
  };

  const handleEditPress = () => {
    // Pre-fill if 1 room selected, else default
    if (selectedRoomIds.length === 1) {
      const room = rooms.find((r) => r.id === selectedRoomIds[0]);
      if (room) {
        setEditType(room.type);
        setEditAc(room.isAc);
        setEditPrice(room.price);
        setEditRoomNumber(room.roomNumber);
      }
    } else {
      setEditType(null); // Force user to choose
      setEditAc(false);
      setEditPrice("");
      setEditRoomNumber("");
    }
    bottomSheetRef.current?.present();
  };

  const handleTypeChange = (newType: string) => {
    setEditType(newType);

    // Auto-update price if available
    // If user manually edited price, maybe we shouldn't overwrite?
    // User request: "update the pricing based on the input... if there exits any"
    // Let's overwrite safely or just overwrite.
    // Since it's an "Edit" usage, picking a new type implies resetting to that type's default usually.

    if (fetchedRoomTypes) {
      const typeDef = fetchedRoomTypes.find((t) => t.name === newType);
      if (typeDef && typeDef.rentAmount) {
        setEditPrice(typeDef.rentAmount.toString());
      }
    }
  };

  const utils = trpc.useUtils();
  const updateRoomMutation = trpc.property.updateRoom.useMutation({
    onSuccess: () => {
      utils.property.getRooms.invalidate();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Room updated successfully",
      });
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update room. Please try again.",
      });
    },
  });
  const updateRoomsBulkMutation = trpc.property.updateRoomsBulk.useMutation({
    onSuccess: () => {
      utils.property.getRooms.invalidate();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Rooms updated successfully",
      });
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update rooms. Please try again.",
      });
    },
  });

  const applyChanges = () => {
    if (selectedRoomIds.length === 0) return;

    if (selectedRoomIds.length === 1) {
      const updatePayload: any = { roomId: selectedRoomIds[0] };
      if (editType) updatePayload.type = editType;
      if (editPrice) updatePayload.price = editPrice;
      updatePayload.isAc = editAc;
      if (editRoomNumber) updatePayload.roomNumber = editRoomNumber;
      updateRoomMutation.mutate(updatePayload);
    } else {
      updateRoomsBulkMutation.mutate({
        roomIds: selectedRoomIds,
        type: editType || undefined,
        isAc: editAc,
        price: editPrice || undefined,
      });
    }

    bottomSheetRef.current?.dismiss();
    setSelectedRoomIds([]); // Clear selection after applying changes
  };

  // -------------------------
  // Room Series Logic
  // -------------------------
  const seriesSheetRef = useRef<BottomSheetModal>(null);
  const [seriesConfig, setSeriesConfig] = useState({
    prefix: "",
    startNum: "1",
  });

  const openSeriesConfig = () => {
    // Determine default prefix and start number based on floor
    let defaultPrefix = "";
    let defaultStart = "1";

    if (selectedFloor === "Ground") {
      defaultPrefix = "G";
      defaultStart = "1";
    } else {
      // 1st -> 1, 2nd -> 2, etc.
      const floorNum = selectedFloor.replace(/\D/g, "");
      if (floorNum) {
        defaultPrefix = floorNum;
        defaultStart = "01";
      }
    }

    setSeriesConfig({
      prefix: defaultPrefix,
      startNum: defaultStart,
    });
    seriesSheetRef.current?.present();
  };

  const renumberMutation = trpc.property.renumberFloorRooms.useMutation({
    onSuccess: () => {
      utils.property.getRooms.invalidate();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Rooms renumbered successfully",
      });
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to renumber rooms. Please try again.",
      });
    },
  });

  const applySeriesConfig = () => {
    if (selectedFloor === "All") return;

    // Convert floor label to floorNumber
    let floorNumber = 0;
    if (selectedFloor === "Ground") floorNumber = 0;
    else {
      const match = selectedFloor.match(/(\d+)/);
      if (match) floorNumber = parseInt(match[1]);
    }

    // Detect padding from startNum string
    // If startNum is "01", padding = 2; if "001", padding = 3; if "1", no padding
    const startNumStr = seriesConfig.startNum;
    const startNumInt = parseInt(startNumStr) || 1;
    const padding =
      startNumStr.length > startNumInt.toString().length
        ? startNumStr.length
        : undefined;

    renumberMutation.mutate({
      floorNumber: floorNumber,
      prefix: seriesConfig.prefix,
      startNumber: startNumInt,
      padding: padding,
    });

    seriesSheetRef.current?.dismiss();
  };

  // -------------------------
  // Add Room Logic
  // -------------------------
  const addRoomSheetRef = useRef<BottomSheetModal>(null);
  const [addRoomNumber, setAddRoomNumber] = useState("");
  const [addType, setAddType] = useState("Single");
  const [addAc, setAddAc] = useState(false);
  const [addPrice, setAddPrice] = useState("");

  const openAddRoom = () => {
    setAddRoomNumber("");
    setAddType("Single");
    // Trigger price update for default "Single" type too?
    // Or just leave empty. "Single" usually has rent.
    if (fetchedRoomTypes) {
      const typeDef = fetchedRoomTypes.find((t) => t.name === "Single");
      if (typeDef && typeDef.rentAmount) {
        setAddPrice(typeDef.rentAmount.toString());
      } else {
        setAddPrice("");
      }
    } else {
      setAddPrice("");
    }
    setAddAc(false);
    addRoomSheetRef.current?.present();
  };

  const handleAddTypeChange = (newType: string) => {
    setAddType(newType);
    if (fetchedRoomTypes) {
      const typeDef = fetchedRoomTypes.find((t) => t.name === newType);
      if (typeDef && typeDef.rentAmount) {
        setAddPrice(typeDef.rentAmount.toString());
      }
    }
  };

  const addRoomMutation = trpc.property.addRoom.useMutation({
    onSuccess: () => {
      utils.property.getRooms.invalidate();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Room added successfully",
      });
      addRoomSheetRef.current?.dismiss();
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add room. Please try again.",
      });
    },
  });

  const handleAddRoom = () => {
    if (!addRoomNumber) {
      alert("Please enter a room number");
      return;
    }

    let floorNumber = 0;
    if (selectedFloor !== "Result" && selectedFloor !== "All") {
      if (selectedFloor === "Ground") floorNumber = 0;
      else {
        const match = selectedFloor.match(/(\d+)/);
        if (match) floorNumber = parseInt(match[1]);
      }
    }

    addRoomMutation.mutate({
      floorNumber,
      roomNumber: addRoomNumber,
      type: addType,
      isAc: addAc,
      price: addPrice,
    });
  };

  return (
    <ScreenWrapper title="Manage Rooms" scrollY={scrollY}>
      <View style={styles.container}>
        <View style={{ paddingTop: headerHeight, flex: 1 }}>
          <ManageRoomsList
            scrollY={scrollY}
            roomsByFloor={roomsByFloor}
            selectedRoomIds={selectedRoomIds}
            onToggleSelection={toggleSelection}
            headerComponent={
              <ManageRoomsHeader
                floors={dynamicFloors}
                selectedFloor={selectedFloor}
                setSelectedFloor={setSelectedFloor}
                selectedRoomCount={selectedRoomIds.length}
                onClearSelection={clearSelection}
                onEditPress={handleEditPress}
              />
            }
            contentHeaderComponent={
              <ManageRoomsFloorConfig
                selectedFloor={selectedFloor}
                onOpenSeriesConfig={openSeriesConfig}
                onAddRoom={openAddRoom}
              />
            }
            isLoading={isLoading && !rooms.length}
            refreshing={isLoading}
            onRefresh={refetch}
          />
        </View>

        <EditRoomSheet
          ref={bottomSheetRef}
          selectedCount={selectedRoomIds.length}
          editRoomNumber={editRoomNumber}
          setEditRoomNumber={setEditRoomNumber}
          editType={editType}
          setEditType={handleTypeChange}
          editAc={editAc}
          setEditAc={setEditAc}
          editPrice={editPrice}
          setEditPrice={setEditPrice}
          onApply={applyChanges}
          sharingTypes={sharingTypes}
        />

        <SeriesConfigSheet
          ref={seriesSheetRef}
          floor={selectedFloor}
          config={seriesConfig}
          setConfig={setSeriesConfig}
          onApply={applySeriesConfig}
        />

        <AddRoomSheet
          ref={addRoomSheetRef}
          floor={selectedFloor}
          roomNumber={addRoomNumber}
          setRoomNumber={setAddRoomNumber}
          type={addType}
          setType={handleAddTypeChange}
          isAc={addAc}
          setIsAc={setAddAc}
          price={addPrice}
          setPrice={setAddPrice}
          onAdd={handleAddRoom}
          sharingTypes={sharingTypes}
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
