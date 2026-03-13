import { Colors } from "@/constants/Colors";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Animated,
  I18nManager,
  Pressable,
  StyleSheet,
  SwitchProps,
  ViewStyle,
} from "react-native";

type CustomSwitchProps = Pick<
  SwitchProps,
  | "value"
  | "onValueChange"
  | "disabled"
  | "trackColor"
  | "thumbColor"
  | "style"
  | "testID"
  | "accessibilityLabel"
  | "accessibilityHint"
  | "accessible"
>;

const TRACK_WIDTH = 36;
const TRACK_HEIGHT = 20;
const THUMB_SIZE = 16;
const TRACK_PADDING = 2;

export function Switch({
  value,
  onValueChange,
  disabled,
  trackColor,
  thumbColor,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessible,
}: CustomSwitchProps) {
  const translateX = React.useRef(
    new Animated.Value(value ? getTranslateX() : 0),
  ).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? getTranslateX() : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [translateX, value]);

  const handlePress = () => {
    if (disabled) return;
    Haptics.selectionAsync();
    onValueChange?.(!value);
  };

  const trackColors = {
    false: "#767577",
    true: Colors.primary,
    ...trackColor,
  };

  const resolvedThumbColor =
    thumbColor || (value ? Colors.white : "#f4f3f4");

  return (
    <Pressable
      onPress={handlePress}
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessible={accessible}
      style={[styles.container, disabled && styles.disabled, style as ViewStyle]}
    >
      <Animated.View
        style={[
          styles.track,
          { backgroundColor: value ? trackColors.true : trackColors.false },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: resolvedThumbColor },
            {
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [0, getTranslateX()],
                    outputRange: I18nManager.isRTL
                      ? [getTranslateX(), 0]
                      : [0, getTranslateX()],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

function getTranslateX() {
  return TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2;
}

const styles = StyleSheet.create({
  container: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: TRACK_PADDING,
    justifyContent: "center",
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
});
