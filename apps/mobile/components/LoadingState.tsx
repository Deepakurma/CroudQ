import { AppColors } from "@/constants/Colors";
import { Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useAppTheme } from "@/context/ThemeContext";
import React from "react";
import {
  ActivityIndicator,
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

interface LoadingStateProps {
  title?: string;
  descriptions?: readonly string[];
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_DESCRIPTIONS = [
  "Analyzing...",
  "Generating insights...",
  "Finding patterns...",
] as const;

export function LoadingState({
  title = "Working on it",
  descriptions = DEFAULT_DESCRIPTIONS,
  style,
}: LoadingStateProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const descriptionOpacity = React.useRef(new Animated.Value(1)).current;
  const resolvedDescriptions = React.useMemo(
    () => descriptions.slice(0, 3),
    [descriptions],
  );
  const descriptionsKey = React.useMemo(
    () => resolvedDescriptions.join("||"),
    [resolvedDescriptions],
  );

  React.useEffect(() => {
    if (resolvedDescriptions.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(descriptionOpacity, {
          toValue: 0.35,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(descriptionOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      setActiveIndex((current) => (current + 1) % resolvedDescriptions.length);
    }, 2500);

    return () => {
      clearInterval(interval);
      descriptionOpacity.stopAnimation();
      descriptionOpacity.setValue(1);
    };
  }, [descriptionOpacity, descriptionsKey, resolvedDescriptions.length]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [descriptionsKey]);

  const activeDescription =
    resolvedDescriptions[activeIndex] ??
    resolvedDescriptions[0] ??
    DEFAULT_DESCRIPTIONS[0];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.spinnerWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Animated.Text
        style={[styles.description, { opacity: descriptionOpacity }]}
      >
        {activeDescription}
      </Animated.Text>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xl,
      gap: Spacing.xs,
    },
    spinnerWrap: {
      width: 56,
      height: 56,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing.s,
    },
    title: {
      color: colors.text,
      fontSize: Typography.size.l,
      fontFamily: Typography.font.semibold,
      textAlign: "center",
    },
    description: {
      color: colors.textSecondary,
      fontSize: Typography.size.m,
      fontFamily: Typography.font.medium,
      textAlign: "center",
    },
  });
