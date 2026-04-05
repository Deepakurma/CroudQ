import { AppColors } from "@/constants/Colors";
import { useAppTheme } from "@/context/ThemeContext";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const SCREEN_SECTION_GAP = 22;
export const SCREEN_CONTENT_GAP = 12;

const SCREEN_TOP_PADDING = 10;
const DEFAULT_BOTTOM_SPACING = 24;
const SCREEN_HORIZONTAL_PADDING = 14;

export type AppScreenBottomInsetBehavior = "tab-bar" | "safe-area" | "none";

function useOptionalBottomTabBarHeight() {
  try {
    return useBottomTabBarHeight();
  } catch {
    return 0;
  }
}

export interface AppScreenProps {
  children: React.ReactNode;
  keyboardAware?: boolean;
  dismissKeyboardOnTap?: boolean;
  bottomInsetBehavior?: AppScreenBottomInsetBehavior;
  bottomContentOffset?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function AppScreen({
  children,
  keyboardAware = false,
  dismissKeyboardOnTap = false,
  bottomInsetBehavior = "safe-area",
  bottomContentOffset = DEFAULT_BOTTOM_SPACING,
  contentContainerStyle,
  refreshing = false,
  onRefresh,
}: AppScreenProps) {
  const { colors } = useAppTheme();
  const tabBarHeight = useOptionalBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const styles = getStyles(
    colors,
    insets.top,
    insets.bottom,
    bottomInsetBehavior,
    bottomContentOffset,
    tabBarHeight,
  );
  const contentStyle = [styles.content, contentContainerStyle];
  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
      colors={[colors.primary, colors.secondary]}
      progressBackgroundColor={colors.card}
    />
  ) : undefined;

  const body = <View style={contentStyle}>{children}</View>;
  const contentBody = dismissKeyboardOnTap ? (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {body}
    </TouchableWithoutFeedback>
  ) : (
    body
  );

  if (keyboardAware) {
    return (
      <LinearGradient colors={colors.gradients.screen} style={styles.container}>
        <KeyboardAwareScrollView
          bottomOffset={DEFAULT_BOTTOM_SPACING}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContentContainer}
          refreshControl={refreshControl}
        >
          {contentBody}
        </KeyboardAwareScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.gradients.screen} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {contentBody}
      </ScrollView>
    </LinearGradient>
  );
}

const getStyles = (
  colors: AppColors,
  topInset: number,
  bottomInset: number,
  bottomInsetBehavior: AppScreenBottomInsetBehavior,
  bottomContentOffset: number,
  tabBarHeight: number,
) => {
  const contentBottomPadding =
    bottomContentOffset +
    (bottomInsetBehavior === "safe-area" ? bottomInset : 0) +
    (bottomInsetBehavior === "tab-bar" ? tabBarHeight : 0);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: topInset + SCREEN_TOP_PADDING,
    },
    scrollContentContainer: {
      flexGrow: 1,
    },
    content: {
      paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
      paddingBottom: contentBottomPadding,
      gap: SCREEN_SECTION_GAP,
    },
  });
};
