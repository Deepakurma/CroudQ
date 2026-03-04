import { ResidentCard } from "@/components/ResidentCard";
import { ResidentSkeletonCard } from "@/components/skeletons/ResidentSkeletonCard";
import { Spacing } from "@/constants/Spacing";
import { Users2 } from "lucide-react-native";
import React, { ReactElement } from "react";
import { Animated, StyleSheet } from "react-native";
import { EmptyState } from "../EmptyState";

interface RentsListProps {
  data: any[];
  scrollY: Animated.Value;
  headerHeight: number;
  ListHeaderComponent?: ReactElement;
  refreshing?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function RentsList({
  data,
  scrollY,
  headerHeight,
  ListHeaderComponent,
  refreshing,
  onRefresh,
  isLoading,
}: RentsListProps) {
  if (isLoading) {
    return (
      <Animated.ScrollView
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight, paddingHorizontal: Spacing.l },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {ListHeaderComponent}
        {[1, 2, 3, 4, 5].map((i) => (
          <ResidentSkeletonCard key={i} />
        ))}
      </Animated.ScrollView>
    );
  }
  return (
    <Animated.FlatList
      data={data}
      refreshing={refreshing}
      onRefresh={onRefresh}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.listContent,
        { paddingTop: headerHeight, paddingHorizontal: Spacing.l },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false },
      )}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            icon={Users2}
            title="No residents Found"
            description="No residents match the selected filter."
          />
        ) : null
      }
      renderItem={({ item }) => (
        <ResidentCard
          item={item}
          showRentStatus={true}
          rentStatus={item.rentStatus}
          statusDate={
            item.rentStatus === "Paid" ? item.paymentDate : item.dueDate
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
    gap: Spacing.l,
  },
});
