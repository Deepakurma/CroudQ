import { NoticeSkeletonCard } from "@/components/skeletons/NoticeSkeletonCard";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import {
  CalendarClock,
  Megaphone,
  MegaphoneOff,
  Trash2,
} from "lucide-react-native";
import React, { ReactElement } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EmptyState } from "../EmptyState";
import { CardShadow } from "@/constants/Shadows";

export interface Notice {
  id: string;
  date: string;
  duration: string;
  active: boolean;
  text: string;
}

interface NoticesListProps {
  data: Notice[];
  scrollY: Animated.Value;
  headerHeight: number;
  ListHeaderComponent: ReactElement;
  refreshing?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
  onDeleteNotice?: (id: string) => void;
  deletingNoticeId?: string;
}

export function NoticesList({
  data,
  scrollY,
  headerHeight,
  ListHeaderComponent,
  refreshing,
  onRefresh,
  isLoading,
  onDeleteNotice,
  deletingNoticeId,
}: NoticesListProps) {
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
        <View style={styles.noticeCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrapper}>
              <Megaphone size={20} color={Colors.primary} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.noticeDate}>{item.date}</Text>
              <View style={styles.durationBadge}>
                <CalendarClock size={12} color={Colors.textSecondary} />
                <Text style={styles.durationText}>{item.duration}</Text>
              </View>
            </View>
            {item.active ? (
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Active</Text>
              </View>
            ) : (
              <View style={styles.expiredBadge}>
                <Text style={styles.expiredText}>Expired</Text>
              </View>
            )}
            {onDeleteNotice ? (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDeleteNotice(item.id)}
                disabled={deletingNoticeId === item.id}
              >
                {deletingNoticeId === item.id ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <Trash2 size={16} color={Colors.error} />
                )}
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.noticeContent}>{item.text}</Text>
        </View>
      )}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            icon={MegaphoneOff}
            title="No Notices"
            description="No notices have been posted yet."
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
  noticeCard: {
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
    ...CardShadow,
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
    gap: 2,
  },
  noticeDate: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.semibold,
    color: Colors.text,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  durationText: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
  },
  activeText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.semibold,
    color: "#166534",
  },
  expiredBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
  },
  expiredText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.font.semibold,
    color: "#991b1b",
  },
  noticeContent: {
    fontSize: Typography.size.l,
    marginLeft: 2,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
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
