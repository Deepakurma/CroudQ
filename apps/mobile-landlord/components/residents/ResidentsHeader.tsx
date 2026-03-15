import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import * as Haptics from "expo-haptics";
import { Search, X } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CardShadow } from "@/constants/Shadows";

interface ResidentsHeaderProps {
  filter?: "All" | "Pending Checkouts";
  setFilter?: (filter: "All" | "Pending Checkouts") => void;
  hasPendingCheckouts?: boolean;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
}

export function ResidentsHeader({
  filter,
  setFilter,
  hasPendingCheckouts = false,
  searchQuery,
  onSearchChange,
}: ResidentsHeaderProps) {
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
          onChangeText={onSearchChange}
        />
        {!!searchQuery && !!onSearchChange && (
          <TouchableOpacity
            onPress={() => onSearchChange("")}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <X size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {filter && setFilter ? (
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
              setFilter("Pending Checkouts");
            }}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.radioCircle,
                hasPendingCheckouts && styles.radioCircleAlert,
                filter === "Pending Checkouts" && styles.radioCircleSelected,
              ]}
            >
              {filter === "Pending Checkouts" && (
                <View
                  style={[
                    styles.radioInnerCircle,
                    hasPendingCheckouts && styles.radioInnerCircleAlert,
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.radioText,
                hasPendingCheckouts && styles.radioTextAlert,
              ]}
            >
              Pending Checkouts
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
    marginLeft: Spacing.s,
    fontSize: Typography.size.l,
    color: Colors.text,
    fontFamily: Typography.font.regular,
  },
  clearButton: {
    padding: 6,
    marginLeft: Spacing.s,
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
  radioCircleAlert: {
    borderColor: Colors.error,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioInnerCircleAlert: {
    backgroundColor: Colors.error,
  },
  radioText: {
    fontSize: Typography.size.m,
    color: Colors.text,
    fontFamily: Typography.font.medium,
  },
  radioTextAlert: {
    color: Colors.error,
  },
});
