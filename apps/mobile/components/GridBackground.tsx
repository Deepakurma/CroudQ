import { Colors } from "@/constants/Colors";
import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";

interface GridBackgroundProps {
  children?: React.ReactNode;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      <View style={styles.svgContainer}>
        <Svg height="100%" width="100%">
          <Defs>
            <Pattern
              id="grid"
              width="30"
              height="30"
              patternUnits="userSpaceOnUse"
            >
              <Rect width="30" height="30" fill={Colors.primary} />
              <Line
                x1="0"
                y1="0"
                x2="30"
                y2="0"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="0.5"
              />
              <Line
                x1="0"
                y1="0"
                x2="0"
                y2="30"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="0.5"
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grid)" />
        </Svg>
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  svgContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});
