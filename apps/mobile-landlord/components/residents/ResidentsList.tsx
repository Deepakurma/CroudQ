import { ResidentCard } from "@/components/ResidentCard";
import { ResidentSkeletonCard } from "@/components/skeletons/ResidentSkeletonCard";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { LogOut, Users2 } from "lucide-react-native";
import React, { ReactElement } from "react";
import { Animated, StyleSheet } from "react-native";
import { EmptyState } from "../EmptyState";

interface ResidentsListProps {
  data: any[];
  scrollY: Animated.Value;
  headerHeight: number;
  ListHeaderComponent?: ReactElement;
  refreshing?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
  readonly?: boolean;
}

export function ResidentsList({
  data,
  scrollY,
  headerHeight,
  ListHeaderComponent,
  refreshing,
  onRefresh,
  isLoading,
  readonly = false,
}: ResidentsListProps) {
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
            icon={readonly ? LogOut : Users2}
            title={readonly ? "No Checkouts" : "No Residents"}
            description={
              readonly
                ? "Past residents will appear here."
                : "Add residents to see them here."
            }
          />
        ) : null
      }
      renderItem={({ item }) => (
        <ResidentCard item={item} readonly={readonly} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
    gap: Spacing.l,
  },
  skeletonCard: {
    backgroundColor: Colors.white,
    padding: Spacing.l,
    borderRadius: 24,
    gap: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 1,
  },
  skeletonHeader: {
    flexDirection: "row",
    gap: Spacing.m,
    alignItems: "center",
  },
});
