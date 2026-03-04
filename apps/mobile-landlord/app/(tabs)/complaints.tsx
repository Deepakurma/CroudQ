import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ComplaintsHeader } from "@/components/complaints/ComplaintsHeader";
import { ComplaintsList } from "@/components/complaints/ComplaintsList";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { trpc } from "@/utils/api";
import { format } from "date-fns";
import { useProperty } from "@/context/PropertyContext";

export default function ComplaintsScreen() {
  const { selectedPropertyId } = useProperty();
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"Unresolved" | "Resolved">("Unresolved");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: complaints,
    isLoading,
    isFetching,
    refetch,
  } = trpc.complaint.list.useQuery(
    {
      status: filter === "Resolved" ? "resolved" : "pending",
      q: debouncedSearch || undefined,
      scopePropertyId: selectedPropertyId || undefined,
    },
    {
      enabled: !!selectedPropertyId,
      placeholderData: (previousData) => previousData,
    },
  );

  const utils = trpc.useUtils();
  const resolveMutation = trpc.complaint.resolve.useMutation({
    onSuccess: () => {
      utils.complaint.list.invalidate();
    },
  });

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const filteredComplaints = (complaints || []).map((c) => ({
      id: c.id,
      roomNumber: c.roomNumber || "N/A",
      floor:
        c.floorNumber !== null && c.floorNumber !== undefined
          ? c.floorNumber === 0
            ? "Ground"
            : `Floor ${c.floorNumber}`
          : "N/A",
      description: c.description || c.title,
      status: (c.status === "resolved" ? "Resolved" : "Unresolved") as
        | "Resolved"
        | "Unresolved",
      date: format(new Date(c.createdAt), "dd MMM, yyyy"),
    }));

  const handleResolve = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resolveMutation.mutate({ id });
  };

  return (
    <ScreenWrapper title="Complaints" scrollY={scrollY}>
      <View style={styles.container}>
        <ComplaintsList
          data={filteredComplaints}
          scrollY={scrollY}
          headerHeight={headerHeight}
          onResolve={handleResolve}
          ListHeaderComponent={
            <ComplaintsHeader
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filter={filter}
              setFilter={setFilter}
            />
          }
          refreshing={isFetching && !isLoading}
          onRefresh={onRefresh}
          isLoading={isLoading && !complaints}
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
