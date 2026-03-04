import { NoticeSkeletonCard } from "@/components/skeletons/NoticeSkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { ClipboardList, ClipboardX, Trash2 } from "lucide-react-native";
import React, { ReactElement } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface TenantComplaintItem {
  id: string;
  date: string;
  active: boolean;
  text: string;
}

interface ComplaintListProps {
  data: TenantComplaintItem[];
  scrollY: Animated.Value;
  headerHeight: number;
  ListHeaderComponent: ReactElement;
  refreshing?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
  onDeleteComplaint?: (id: string) => void;
  deletingComplaintId?: string;
}

export function ComplaintList({
  data,
  scrollY,
  headerHeight,
  ListHeaderComponent,
  refreshing,
  onRefresh,
  isLoading,
  onDeleteComplaint,
  deletingComplaintId,
}: ComplaintListProps) {
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
        {[1, 2, 3].map((i) => (
          <NoticeSkeletonCard key={i} />
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
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrapper}>
              <ClipboardList size={20} color={Colors.primary} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.titleText}>{item.date}</Text>
              <Text style={styles.metaText}>Raised Complaint</Text>
            </View>
            {item.active ? (
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Open</Text>
              </View>
            ) : (
              <View style={styles.closedBadge}>
                <Text style={styles.closedText}>Resolved</Text>
              </View>
            )}
            {onDeleteComplaint ? (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDeleteComplaint(item.id)}
                disabled={deletingComplaintId === item.id}
              >
                {deletingComplaintId === item.id ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <Trash2 size={16} color={Colors.error} />
                )}
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={styles.bodyText}>{item.text}</Text>
        </View>
      )}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            icon={ClipboardX}
            title="No Complaints"
            description="No complaints raised yet."
          />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
    gap: Spacing.l,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.l,
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
  },
  titleText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
  },
  metaText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
  },
  activeText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.semibold,
    color: "#1d4ed8",
  },
  closedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
  },
  closedText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.semibold,
    color: "#166534",
  },
  bodyText: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginLeft: 2,
  },
  deleteButton: {
    marginLeft: Spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
  },
});
