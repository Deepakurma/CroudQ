import { EmptyState } from "@/components/EmptyState";
import { Colors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ChevronRight, Megaphone } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SkeletonLoader } from "../ui/SkeletonLoader";
import { CardShadow } from "@/constants/Shadows";

export interface RecentNoticeItem {
  id: string;
  text: string;
  createdAt?: string | Date;
}

interface RecentNoticeProps {
  notice: RecentNoticeItem | null;
  isLoading?: boolean;
}

export function RecentNotice({ notice, isLoading = false }: RecentNoticeProps) {
  return (
    <View style={styles.section}>
      {!notice && (
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderSubRow}>
            <Text style={styles.sectionHeader}>Recently Posted Notice </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/notices" as any)}>
            <View style={styles.viewAll}>
              <Text style={styles.viewAllText}>View all</Text>
              <ChevronRight color={Colors.textSecondary} size={Spacing.l} />
            </View>
          </TouchableOpacity>
        </View>
      )}
      {isLoading ? (
        <>
          <View style={styles.skeletonHeader}>
            <SkeletonLoader width={40} height={40} borderRadius={20} />
            <View style={styles.headerInfo}>
              <SkeletonLoader width={100} height={20} borderRadius={4} />
              <SkeletonLoader width={60} height={14} borderRadius={4} />
            </View>
            <SkeletonLoader width={60} height={24} borderRadius={12} />
          </View>

          {/* Body: Text */}
          <View style={{ gap: 8 }}>
            <SkeletonLoader width="100%" height={16} borderRadius={4} />
            <SkeletonLoader width="90%" height={16} borderRadius={4} />
            <SkeletonLoader width="40%" height={16} borderRadius={4} />
          </View>
        </>
      ) : notice ? (
        <LinearGradient
          colors={["#f8e9d4", "#f4decb", "#f1d6c7"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.noticeCard}
        >
          <View style={styles.noticeHeader}>
            <View style={styles.noticeIconWrap}>
              <Megaphone size={22} color="#ffffff" />
            </View>
            <View style={styles.noticeMeta}>
              <Text style={styles.noticeLabel}>Recent Notice</Text>
              {notice.createdAt ? (
                <Text style={styles.noticePostedOn} numberOfLines={1}>
                  Posted on {format(new Date(notice.createdAt), "dd MMM yyyy")}
                </Text>
              ) : null}
            </View>
          </View>
          <Text style={styles.noticeContent}>{notice.text}</Text>
        </LinearGradient>
      ) : (
        <EmptyState description="There is no active notice posted." />
      )}
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
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeaderSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  badgeCount: {
    fontSize: Typography.size.m,
    color: Colors.textSecondary,
    fontFamily: Typography.font.regular,
  },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  viewAllText: {
    fontSize: Typography.size.m,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
  },
  noticeCard: {
    backgroundColor: "#f8e9d4",
    borderRadius: 28,
    paddingVertical: Spacing.m + 2,
    paddingHorizontal: Spacing.l,
    borderWidth: 1,
    borderColor: "#efd4bc",
    gap: Spacing.s,
    minHeight: 108,
    shadowColor: "#80520e",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    ...CardShadow,
    elevation: 2,
  },
  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  noticeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#f3aa26",
    alignItems: "center",
    justifyContent: "center",
  },
  noticeMeta: {
    flex: 1,
    justifyContent: "center",
    gap: 1,
  },
  noticeLabel: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.font.bold,
    color: "#e28a00",
  },
  noticePostedOn: {
    fontSize: Typography.size.s,
    fontFamily: Typography.font.regular,
    color: Colors.textSecondary,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  noticeContent: {
    fontSize: Typography.size.l,
    fontFamily: Typography.font.semibold,
    color: "#e28a00",
    lineHeight: 22,
  },
  skeletonHeader: {
    flexDirection: "row",
    gap: Spacing.m,
    alignItems: "center",
  },
});
