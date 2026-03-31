import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/EmptyState";
import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { BarChart3 } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface InsightCarouselCard {
  id: string;
  badgeLabel?: string;
  metric: string;
  title: string;
  tone: "positive" | "negative" | "active" | "neutral";
}

interface InsightCarouselProps {
  cards?: readonly InsightCarouselCard[];
}

export function InsightCarousel({ cards }: InsightCarouselProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const resolvedCards = cards ?? [];
  const [heroInsight, ...supportingInsights] = resolvedCards;
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [supportingCardHeight, setSupportingCardHeight] = useState(0);

  const slideGap = Spacing.m;
  const slideWidth = carouselWidth || undefined;
  const snapInterval = carouselWidth + slideGap;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    setCarouselWidth((currentWidth) =>
      currentWidth === nextWidth ? currentWidth : nextWidth,
    );
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (snapInterval <= 0) {
        return;
      }

      const { contentOffset } = event.nativeEvent;
      const nextIndex = Math.round(contentOffset.x / snapInterval);
      setActiveIndex(nextIndex);
    },
    [snapInterval],
  );

  const handleSupportingCardLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setSupportingCardHeight((currentHeight) =>
      nextHeight > currentHeight ? nextHeight : currentHeight,
    );
  }, []);

  if (!heroInsight) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No signals yet"
        description="Signals will appear after more recent data comes in."
      />
    );
  }

  return (
    <View style={styles.stack}>
      <Animated.View entering={FadeInDown.springify()}>
        <Card style={styles.heroCard}>
          <LinearGradient
            colors={colors.gradients.card}
            style={styles.heroGradient}
          >
            <View style={styles.heroHeader}>
              <Badge
                text={heroInsight.badgeLabel ?? getToneLabel(heroInsight.tone)}
                variant={getBadgeVariant(heroInsight.tone)}
              />
              <Text style={styles.heroKicker}>Biggest signal</Text>
            </View>

            <Text style={styles.heroMetric} numberOfLines={2}>
              {heroInsight.metric}
            </Text>
            <Text style={styles.heroTitle} numberOfLines={3}>
              {heroInsight.title}
            </Text>
          </LinearGradient>
        </Card>
      </Animated.View>

      {supportingInsights.length > 0 ? (
        <View style={styles.supportingSection} onLayout={handleLayout}>
          <Animated.View entering={FadeInDown.delay(90).springify()}>
            <FlatList
              data={supportingInsights}
              keyExtractor={(item) => item.id}
              horizontal
              style={
                supportingCardHeight > 0
                  ? { minHeight: supportingCardHeight }
                  : undefined
              }
              decelerationRate="fast"
              disableIntervalMomentum
              snapToAlignment="start"
              snapToInterval={snapInterval > 0 ? snapInterval : undefined}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              contentContainerStyle={styles.supportingList}
              ItemSeparatorComponent={() => (
                <View style={styles.supportingSeparator} />
              )}
              initialNumToRender={supportingInsights.length}
              maxToRenderPerBatch={supportingInsights.length}
              windowSize={3}
              renderItem={({ item }) => (
                <View style={[styles.supportingSlide, { width: slideWidth }]}>
                  <View onLayout={handleSupportingCardLayout}>
                    <Card
                      style={[
                        styles.supportingCard,
                        supportingCardHeight > 0
                          ? { minHeight: supportingCardHeight }
                          : null,
                      ]}
                    >
                      <View style={styles.supportingTopRow}>
                        <View style={styles.supportingMetricWrap}>
                          <Text
                            style={styles.supportingMetric}
                            numberOfLines={2}
                          >
                            {item.metric}
                          </Text>
                        </View>
                        <View style={styles.supportingBadgeWrap}>
                          <Badge
                            text={item.badgeLabel ?? getToneLabel(item.tone)}
                            variant={getBadgeVariant(item.tone)}
                          />
                        </View>
                      </View>

                      <Text style={styles.supportingTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </Card>
                  </View>
                </View>
              )}
            />
          </Animated.View>

          <View style={styles.pagination}>
            {supportingInsights.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.paginationDot,
                  index === activeIndex ? styles.paginationDotActive : null,
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function getToneLabel(tone: InsightCarouselCard["tone"]) {
  switch (tone) {
    case "negative":
      return "Needs attention";
    case "neutral":
      return "Worth trying";
    default:
      return "Doing well";
  }
}

function getBadgeVariant(
  tone: InsightCarouselCard["tone"],
): "positive" | "negative" | "neutral" {
  switch (tone) {
    case "negative":
      return "negative";
    case "neutral":
      return "neutral";
    default:
      return "positive";
  }
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    stack: {
      gap: Spacing.m,
    },
    heroCard: {
      padding: 0,
      overflow: "hidden",
    },
    heroGradient: {
      padding: Spacing.xl,
      gap: Spacing.m,
    },
    heroHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: Spacing.m,
    },
    heroKicker: {
      color: colors.textMuted,
      fontSize: Typography.size.s,
      fontFamily: Typography.font.medium,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    heroMetric: {
      color: colors.text,
      fontSize: Typography.size["3xl"],
      fontFamily: Typography.font.bold,
    },
    heroTitle: {
      color: colors.text,
      fontSize: Typography.size.l,
      fontFamily: Typography.font.bold,
      textTransform: "capitalize",
    },
    supportingSection: {
      gap: Spacing.m,
    },
    supportingList: {
      paddingRight: Spacing.m,
    },
    supportingSlide: {
      flex: 1,
    },
    supportingSeparator: {
      width: Spacing.m,
    },
    supportingCard: {
      gap: Spacing.l,
      backgroundColor: colors.backgroundElevated,
      width: "100%",
    },
    supportingTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: Spacing.m,
    },
    supportingMetricWrap: {
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.s,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    supportingBadgeWrap: {
      justifyContent: "center",
      alignItems: "flex-end",
    },
    supportingMetric: {
      color: colors.text,
      fontSize: Typography.size.l,
      fontFamily: Typography.font.bold,
    },
    supportingTitle: {
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.medium,
      textTransform: "capitalize",
    },
    pagination: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.s,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.border,
    },
    paginationDotActive: {
      width: 24,
      backgroundColor: colors.primary,
    },
  });
