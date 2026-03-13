import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { CardShadow } from "@/constants/Shadows";
import * as Haptics from "expo-haptics";
import { Search } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ComplaintsHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filter: "Unresolved" | "Resolved";
  setFilter: (filter: "Unresolved" | "Resolved") => void;
}

export function ComplaintsHeader({
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
}: ComplaintsHeaderProps) {
  return (
    <View style={{ gap: Spacing.l }}>
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
            setFilter("Unresolved");
          }}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.radioCircle,
              filter === "Unresolved" && styles.radioCircleSelected,
            ]}
          >
            {filter === "Unresolved" && (
              <View style={styles.radioInnerCircle} />
            )}
          </View>
          <Text style={styles.radioText}>Unresolved</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => {
            Haptics.selectionAsync();
            setFilter("Resolved");
          }}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.radioCircle,
              filter === "Resolved" && styles.radioCircleSelected,
            ]}
          >
            {filter === "Resolved" && <View style={styles.radioInnerCircle} />}
          </View>
          <Text style={styles.radioText}>Resolved</Text>
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
    paddingHorizontal: Spacing.l,
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
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.xl,
    paddingHorizontal: Spacing.xs,
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
});
