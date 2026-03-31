import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/EmptyState";
import { AppColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { MessageSquareMore } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Spacing } from "@/constants/Spacing";

interface CommentCluster {
  id: string;
  title: string;
  count: number;
  preview: readonly string[];
}

interface CommentClusterListProps {
  clusters?: readonly CommentCluster[];
}

export function CommentClusterList({ clusters }: CommentClusterListProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const resolvedClusters = clusters ?? [];

  if (resolvedClusters.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareMore}
        title="No comment themes yet"
        description="Themes will appear once more comments are available."
      />
    );
  }

  return (
    <View style={styles.list}>
      {resolvedClusters.map((cluster) => (
        <Card key={cluster.id} style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <MessageSquareMore size={18} color={colors.text} />
            </View>
            <Text style={styles.title}>{cluster.title}</Text>
            <View style={styles.badgeWrap}>
              <Badge text={`${cluster.count} comments`} variant="default" />
            </View>
          </View>

          <View style={styles.previewWrap}>
            {cluster.preview.map((snippet) => (
              <Text key={snippet} style={styles.preview}>
                &quot;{snippet}&quot;
              </Text>
            ))}
          </View>
        </Card>
      ))}
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    list: {
      gap: 14,
    },
    card: {
      gap: 16,
    },
    header: {
      flexDirection: "row",
      gap: Spacing.m,
      alignItems: "center",
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft,
    },
    title: {
      flex: 1,
      minWidth: 0,
      flexShrink: 1,
      color: colors.text,
      fontSize: Typography.size.l,
      fontFamily: Typography.font.semibold,
    },
    badgeWrap: {
      marginLeft: "auto",
      flexShrink: 0,
    },
    count: {
      color: colors.textSecondary,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
    },
    previewWrap: {
      gap: 8,
    },
    preview: {
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.regular,
    },
  });
