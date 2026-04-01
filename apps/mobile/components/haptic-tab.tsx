import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

type HapticTabProps = BottomTabBarButtonProps & {
  disabled?: boolean | null;
  disabledTitle?: string;
  disabledMessage?: string;
};

export function HapticTab({
  disabled = false,
  disabledTitle,
  disabledMessage,
  style,
  onPress,
  onPressIn,
  ...props
}: HapticTabProps) {
  return (
    <PlatformPressable
      {...props}
      style={[
        style,
        disabled
          ? {
              opacity: 0.42,
            }
          : null,
      ]}
      onPress={(ev) => {
        if (disabled) {
          Toast.show({
            type: "info",
            text1: disabledTitle ?? "Unavailable",
            text2: disabledMessage ?? "Connect YouTube account to view.",
          });
          return;
        }

        onPress?.(ev);
      }}
      onPressIn={(ev) => {
        if (disabled) {
          return;
        }

        if (process.env.EXPO_OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(ev);
      }}
    />
  );
}
