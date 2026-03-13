import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import {
  DoorClosed,
  DoorOpen,
  PieChart,
  UsersRound,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Dimensions, FlatList, StyleSheet, Text, View } from "react-native";
import { StatCardSkeleton } from "../skeletons/StatCardSkeleton";
import { CardShadow } from "@/constants/Shadows";

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width - Spacing.l * 2;
const CARD_WIDTH = (ITEM_WIDTH - Spacing.l) / 2;

export interface DashboardStatsProps {
  totalResidents: number;
  occupancyRate: number;
  availableRooms: number;
  occupiedRooms: number;
  isLoading?: boolean;
}

export function DashboardStats({
  totalResidents = 0,
  occupancyRate = 0,
  availableRooms = 0,
  occupiedRooms = 0,
  isLoading = false,
}: DashboardStatsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const statsData = [
    {
      key: "total-residents",
      amount: totalResidents.toString(),
      label: "Total Residents",
      icon: <UsersRound size={24} color="#a83bf6ff" />,
    },
    {
      key: "occupancy",
      amount: `${occupancyRate}%`,
      label: "Occupancy Rate",
      icon: <PieChart size={24} color={Colors.error} />,
    },
    {
      key: "available-rooms",
      amount: availableRooms.toString(),
      label: "Available Rooms",
      icon: <DoorOpen size={24} color="#22c55e" />,
    },
    {
      key: "occupied-rooms",
      amount: occupiedRooms.toString(),
      label: "Occupied Rooms",
      icon: <DoorClosed size={24} color="brown" />,
    },
  ];

  const statsSlides = chunkArray(statsData, 2);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <>
      {/* Dashboard Title & Dots */}
      <View style={styles.headerRow}>
        <Text style={styles.subHead}> Overview</Text>
        <View style={styles.dotsContainer}>
          {statsSlides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, { opacity: index === activeIndex ? 1 : 0.4 }]}
            />
          ))}
        </View>
      </View>

      {/* Stats Carousel */}
      <View style={{ marginHorizontal: -Spacing.l }}>
        <FlatList
          data={statsSlides}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH + Spacing.l}
          decelerationRate="fast"
          snapToAlignment="start"
          contentContainerStyle={{
            gap: Spacing.l,
            paddingHorizontal: Spacing.l,
            paddingVertical: 2,
          }}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width: ITEM_WIDTH }]}>
              {item.map((stat) => (
                <View
                  key={stat.key}
                  style={[styles.statCard, { width: CARD_WIDTH }]}
                >
                  {isLoading ? (
                    <StatCardSkeleton />
                  ) : (
                    <>
                      <View style={styles.statIconCircle}>{stat.icon}</View>
                      <Text style={styles.statAmount}>{stat.amount}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.m,
  },
  subHead: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.font.bold,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    overflow: "hidden",
  },
  slide: {
    flexDirection: "row",
    gap: Spacing.l,
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.l,
    justifyContent: "space-between",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    ...CardShadow,
    elevation: 1,
  },
  statIconCircle: {
    justifyContent: "center",
    marginBottom: 5,
  },
  statAmount: {
    fontSize: Typography.size["2xl"],
    fontFamily: Typography.font.bold,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
  },
});
