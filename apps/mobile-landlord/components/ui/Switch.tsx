import { Colors } from "@/constants/Colors";
import * as Haptics from "expo-haptics";
import React from "react";
import { Switch as RNSwitch, SwitchProps } from "react-native";

type CustomSwitchProps = SwitchProps;

export function Switch({
  value,
  onValueChange,
  trackColor,
  thumbColor,
  ...props
}: CustomSwitchProps) {
  const handleValueChange = (val: boolean) => {
    Haptics.selectionAsync();
    onValueChange?.(val);
  };

  return (
    <RNSwitch
      trackColor={{ false: "#767577", true: Colors.primary, ...trackColor }}
      thumbColor={thumbColor || (value ? Colors.white : "#f4f3f4")}
      ios_backgroundColor="#3e3e3e"
      onValueChange={handleValueChange}
      value={value}
      {...props}
    />
  );
}
