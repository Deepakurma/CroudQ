import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import * as Haptics from "expo-haptics";
import { Search, SlidersHorizontal } from "lucide-react-native";
import { CardShadow } from "@/constants/Shadows";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface RoomsHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filter: "All" | "Available" | "Occupied";
  setFilter: (filter: "All" | "Available" | "Occupied") => void;
  onOpenFilters: () => void;
}

export function RoomsHeader({
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  onOpenFilters,
}: RoomsHeaderProps) {
  return (
    <View style={{ gap: Spacing.l }}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textSecondary} />
        <TextInput
          placeholder="Search by room or name"
          style={styles.searchInput}
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Radio Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => {
            Haptics.selectionAsync();
            setFilter("All");
          }}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.radioCircle,
              filter === "All" && styles.radioCircleSelected,
            ]}
          >
            {filter === "All" && <View style={styles.radioInnerCircle} />}
          </View>
          <Text style={styles.radioText}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => {
            Haptics.selectionAsync();
            setFilter("Available");
          }}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.radioCircle,
              filter === "Available" && styles.radioCircleSelected,
            ]}
          >
            {filter === "Available" && <View style={styles.radioInnerCircle} />}
          </View>
          <Text style={styles.radioText}>Available</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => {
            Haptics.selectionAsync();
            setFilter("Occupied");
          }}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.radioCircle,
              filter === "Occupied" && styles.radioCircleSelected,
            ]}
          >
            {filter === "Occupied" && <View style={styles.radioInnerCircle} />}
          </View>
          <Text style={styles.radioText}>Occupied</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterBtn} onPress={onOpenFilters}>
          <SlidersHorizontal size={16} color={Colors.text} />
          <Text
            style={{
              color: Colors.text,
              fontSize: Typography.size.m,
              fontFamily: Typography.font.medium,
            }}
          >
            Filter
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 25,
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
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: Typography.size.l,
    color: Colors.text,
    fontFamily: Typography.font.regular,
  },
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.l,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioText: {
    fontSize: Typography.size.m,
    color: Colors.text,
    fontFamily: Typography.font.medium,
  },
  filterBtn: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: 20,
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
});
