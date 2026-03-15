import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import {
  DoorOpen,
  HousePlus,
  LogOut,
  MailPlus,
  Megaphone,
  MessageSquareWarning,
  UserRound,
  UsersRound,
} from "lucide-react-native";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

const ACTION_BUTTONS = [
  {
    key: "add-property",
    icon: <HousePlus size={Spacing["2xl"]} color={Colors.primary} />,
    label: "Add Property",
  },
  {
    key: "checkouts",
    icon: <LogOut size={Spacing["2xl"]} color={Colors.primary} />,
    label: "Checkouts",
  },
  {
    key: "rooms",
    icon: <DoorOpen size={Spacing["2xl"]} color={Colors.primary} />,
    label: "Rooms",
  },
  {
    key: "residents",
    icon: <UsersRound size={Spacing["2xl"]} color={Colors.primary} />,
    label: "Residents",
  },
  {
    key: "property-incharge",
    icon: <UserRound size={Spacing["2xl"]} color={Colors.primary} />,
    label: "Incharge",
  },
  {
    key: "complains",
    icon: <MessageSquareWarning size={Spacing["2xl"]} color={Colors.primary} />,
    label: "Complains",
  },
  {
    key: "notices",
    icon: <Megaphone size={Spacing["2xl"]} color={Colors.primary} />,
    label: "Notices",
  },
  {
    key: "write us",
    icon: <MailPlus size={Spacing["2xl"]} color={Colors.primary} />,
    label: "Write Us",
  },
];

function ActionButton({
  icon,
  label,
  onPress,
  showAlertDot = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  showAlertDot?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.actionIcon}>
        {icon}
        {showAlertDot ? <View style={styles.alertDot} /> : null}
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function QuickActions({
  hasUnresolvedComplaints = false,
  hasPendingCheckouts = false,
  canAddProperty = true,
}: {
  hasUnresolvedComplaints?: boolean;
  hasPendingCheckouts?: boolean;
  canAddProperty?: boolean;
}) {
  const router = useRouter();

  const handlePress = (key: string) => {
    switch (key) {
      case "checkouts":
        router.push("/checkouts" as any);
        break;
      case "rooms":
        router.push("/rooms" as any);
        break;
      case "add-property":
        if (!canAddProperty) {
          Toast.show({
            type: "error",
            text1: "Property Limit Reached",
            text2: "You can only add up to 3 properties.",
          });
          break;
        }
        router.push("/onboarding" as any);
        break;
      case "complains":
        router.push("/complaints" as any);
        break;
      case "notices":
        router.push("/notices" as any);
        break;
      case "residents":
        router.push("/residents" as any);
        break;
      case "property-incharge":
        router.push("/property-incharge" as any);
        break;
      case "write us":
        router.push("/write-us" as any);
        break;
      default:
        console.log(`Action ${key} not implemented yet`);
        break;
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>Quick Actions</Text>

      <FlatList
        data={ACTION_BUTTONS}
        numColumns={4}
        scrollEnabled={false}
        contentContainerStyle={styles.actionsGrid}
        renderItem={({ item }) => (
          <View style={styles.actionBtn}>
            <ActionButton
              icon={item.icon}
              label={item.label}
              disabled={item.key === "add-property" && !canAddProperty}
              showAlertDot={
                (item.key === "complains" && hasUnresolvedComplaints) ||
                (item.key === "residents" && hasPendingCheckouts)
              }
              onPress={() => handlePress(item.key)}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.xl,
  },
  sectionHeader: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.bold,
    color: Colors.text,
  },
  actionsGrid: {
    gap: Spacing.xl,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  actionBtnDisabled: {
    opacity: 0.8,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: Spacing.m,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  alertDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 50,
    backgroundColor: Colors.error,
  },
  actionLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 12,
    fontFamily: Typography.font.regular,
  },
});
