import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { CardShadow } from "@/constants/Shadows";
import * as Haptics from "expo-haptics";
import { Bell, Check, Search } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface RentsHeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  filter: "Due" | "Paid";
  setFilter: (filter: "Due" | "Paid") => void;
  isNotified?: boolean;
  setIsNotified?: (isNotified: boolean) => void;
}

export function RentsHeader({
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  isNotified,
  setIsNotified,
}: RentsHeaderProps) {
  const [internalSearchQuery, setInternalSearchQuery] = React.useState("");
  const [internalIsNotified, setInternalIsNotified] = React.useState(false);

  const resolvedSearchQuery = searchQuery ?? internalSearchQuery;
  const resolvedSetSearchQuery = setSearchQuery ?? setInternalSearchQuery;
  const resolvedIsNotified = isNotified ?? internalIsNotified;
  const resolvedSetIsNotified = setIsNotified ?? setInternalIsNotified;

  return (
    <View style={{ gap: Spacing.l }}>
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textSecondary} />
        <TextInput
          placeholder="Search by room or name"
          style={styles.searchInput}
          placeholderTextColor={Colors.textSecondary}
          value={resolvedSearchQuery}
          onChangeText={resolvedSetSearchQuery}
        />
      </View>

      {/* Radio Filters */}
      <View style={styles.filterContainer}>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => {
              Haptics.selectionAsync();
              setFilter("Due");
            }}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.radioCircle,
                filter === "Due" && styles.radioCircleSelected,
              ]}
            >
              {filter === "Due" && <View style={styles.radioInnerCircle} />}
            </View>
            <Text style={styles.radioText}>Due</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => {
              Haptics.selectionAsync();
              setFilter("Paid");
            }}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.radioCircle,
                filter === "Paid" && styles.radioCircleSelected,
              ]}
            >
              {filter === "Paid" && <View style={styles.radioInnerCircle} />}
            </View>
            <Text style={styles.radioText}>Paid</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.notifyBtn,
            resolvedIsNotified && styles.notifyBtnActive,
          ]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            resolvedSetIsNotified(!resolvedIsNotified);
          }}
        >
          {resolvedIsNotified ? (
            <Check size={16} color={Colors.white} />
          ) : (
            <Bell size={16} color={Colors.text} />
          )}
          <Text
            style={[
              styles.notifyBtnText,
              resolvedIsNotified && styles.notifyBtnTextActive,
            ]}
          >
            {resolvedIsNotified ? "Notified" : "Notify"}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
  },
  radioGroup: {
    flexDirection: "row",
    gap: Spacing.xl,
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
  notifyBtn: {
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
  notifyBtnActive: {
    backgroundColor: Colors.primary,
  },
  notifyBtnText: {
    color: Colors.text,
    fontSize: Typography.size.m,
    fontFamily: Typography.font.medium,
  },
  notifyBtnTextActive: {
    color: Colors.white,
  },
});
