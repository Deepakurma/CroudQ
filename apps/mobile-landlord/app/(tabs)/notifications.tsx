import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  IndianRupee,
  MessageSquare,
} from "lucide-react-native";
import React, { useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Mock Data for Notifications
const NOTIFICATIONS = [
  {
    id: "1",
    type: "rent_due",
    title: "Rent Pending",
    message: "5 residents have pending rent payments for this month.",
    timestamp: "2 hours ago",
    priority: "high",
    count: 5,
  },
  {
    id: "2",
    type: "complaint",
    title: "Pending Complaints",
    message: "There are 3 new complaints regarding water supply.",
    timestamp: "5 hours ago",
    priority: "medium",
    count: 3,
  },
  {
    id: "3",
    type: "subscription",
    title: "Subscription Renewal",
    message: "Your property management subscription expires in 3 days.",
    timestamp: "1 day ago",
    priority: "critical",
    count: 1,
  },
  {
    id: "4",
    type: "maintenance",
    title: "Scheduled Maintenance",
    message: "Elevator maintenance is scheduled for tomorrow at 10 AM.",
    timestamp: "1 day ago",
    priority: "low",
    count: 1,
  },
  {
    id: "5",
    type: "rent_due",
    title: "Rent Overdue",
    message: "2 residents have overdue payments from last month.",
    timestamp: "2 days ago",
    priority: "high",
    count: 2,
  },
];

const getIcon = (type: string, priority: string) => {
  switch (type) {
    case "rent_due":
      return <IndianRupee size={24} color={Colors.error} />;
    case "complaint":
      return <MessageSquare size={24} color={Colors.warning} />;
    case "subscription":
      return <AlertTriangle size={24} color={Colors.error} />;
    case "maintenance":
      return <Clock size={24} color={Colors.primary} />;
    default:
      return <AlertCircle size={24} color={Colors.textSecondary} />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical":
      return "#fee2e2"; // Light Red
    case "high":
      return "#ffedd5"; // Light Orange
    case "medium":
      return "#fef9c3"; // Light Yellow
    case "low":
      return "#f1f5f9"; // Light Gray
    default:
      return "#f1f5f9";
  }
};

export default function NotificationsScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 65;

  return (
    <ScreenWrapper title="Notifications" scrollY={scrollY}>
      <View style={styles.container}>
        <Animated.FlatList
          data={NOTIFICATIONS}
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
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.notificationCard}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getPriorityColor(item.priority) },
                ]}
              >
                {getIcon(item.type, item.priority)}
              </View>

              <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>
                <Text style={styles.message} numberOfLines={2}>
                  {item.message}
                </Text>
              </View>

              {/* Optional: Add a subtle indicator if needed, e.g., for unread status */}
              {item.priority === "critical" && (
                <View style={styles.unreadDot} />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // Replaced Colors.background
  },
  listContent: {
    paddingBottom: 20,
    gap: Spacing.m,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.m,
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
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2, // Align with title
  },
  contentContainer: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  title: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
    flex: 1, // Allow text to wrap if needed
    marginRight: Spacing.s,
  },
  timestamp: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.medium,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  message: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    position: "absolute",
    top: Spacing.m,
    right: Spacing.m,
    // Adjust based on where you want the visual cue
    display: "none", // Hidden for now unless user wants unread logic
  },
  arrowContainer: {
    // Removed arrow for cleaner look, or can be re-added
    justifyContent: "center",
    alignItems: "center",
  },
});
