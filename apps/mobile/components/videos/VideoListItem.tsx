import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { ChevronRight, Play } from "lucide-react-native";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface VideoListItemProps {
  title: string;
  duration: string;
  thumbnailUrl?: string | null;
  badgeVariant?: "positive" | "negative" | "active" | "pending" | "neutral" | "default";
  badgeLabel: string;
  onPress: () => void;
}

export function VideoListItem(props: VideoListItemProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <Pressable onPress={props.onPress} style={styles.pressable}>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.thumb}>
            {props.thumbnailUrl ? (
              <Image
                source={{ uri: props.thumbnailUrl }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient colors={colors.gradients.card} style={styles.thumbFallback}>
                <View style={styles.playButton}>
                  <Play size={16} color={colors.primary} fill={colors.primary} />
                </View>
              </LinearGradient>
            )}
            <View style={styles.durationPill}>
              <Text style={styles.duration}>{props.duration}</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.header}>
              <Badge text={props.badgeLabel} variant={props.badgeVariant ?? "active"} />
              <ChevronRight size={18} color={colors.textMuted} />
            </View>

            <Text style={styles.title} numberOfLines={3} ellipsizeMode="tail">
              {props.title}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    pressable: {
      borderRadius: 28,
    },
    card: {
      gap: Spacing.l,
    },
    topRow: {
      flexDirection: "row",
      gap: Spacing.l,
      alignItems: "stretch",
    },
    thumb: {
      width: 116,
      height: 116,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      position: "relative",
    },
    thumbnailImage: {
      width: "100%",
      height: "100%",
    },
    thumbFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xs,
    },
    playButton: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    durationPill: {
      position: "absolute",
      left: Spacing.m,
      bottom: Spacing.m,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: colors.overlay,
    },
    duration: {
      color: colors.white,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.semibold,
    },
    content: {
      flex: 1,
      gap: Spacing.m,
      paddingVertical: 2,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: Spacing.s,
    },
    title: {
      color: colors.text,
      fontSize: Typography.size.xl,
      lineHeight: Typography.lineHeight.l,
      fontFamily: Typography.font.semibold,
    },
  });
