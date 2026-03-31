import { Platform } from "react-native";

export type AppColors = {
  background: string;
  backgroundElevated: string;
  backgroundMuted: string;
  card: string;
  cardSecondary: string;
  cardBorder: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  white: string;
  primary: string;
  secondary: string;
  accent: string;
  accentSoft: string;
  accentStrong: string;
  positive: string;
  neutral: string;
  negative: string;
  success: string;
  error: string;
  info: string;
  overlay: string;
  skeleton: string;
  tabBar: string;
  chip: string;
  chartGrid: string;
  gradients: {
    screen: readonly [string, string, string];
    hero: readonly [string, string, string];
    card: readonly [string, string];
  };
};

export const darkColors: AppColors = {
  background: "#090B14",
  backgroundElevated: "#111526",
  backgroundMuted: "#171C32",
  card: "rgba(21, 26, 47, 0.92)",
  cardSecondary: "rgba(16, 20, 36, 0.86)",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  border: "rgba(255, 255, 255, 0.08)",
  text: "#F5F7FF",
  textSecondary: "#9AA3C7",
  textMuted: "#7A84A8",
  white: "#FFFFFF",
  primary: "#7C5CFF",
  secondary: "#49A8FF",
  accent: "#1C2342",
  accentSoft: "#20294E",
  accentStrong: "#2C3670",
  positive: "#3DD9A3",
  neutral: "#F3C969",
  negative: "#FF7A90",
  success: "#3DD9A3",
  error: "#D54867",
  info: "#6FB6FF",
  overlay: "rgba(4, 7, 16, 0.78)",
  skeleton: "rgba(255, 255, 255, 0.08)",
  tabBar: "rgba(10, 13, 24, 0.95)",
  chip: "rgba(255, 255, 255, 0.06)",
  chartGrid: "rgba(255, 255, 255, 0.07)",
  gradients: {
    screen: ["#090B14", "#0F1430", "#090B14"] as const,
    hero: ["#161C3F", "#11172C", "#090B14"] as const,
    card: ["rgba(124, 92, 255, 0.18)", "rgba(73, 168, 255, 0.02)"] as const,
  },
};

export const lightColors: AppColors = {
  background: "rgb(245, 245, 245)",
  backgroundElevated: "#FFFFFF",
  backgroundMuted: "#ECF1FF",
  card: "#FFFFFF",
  cardSecondary: "#F5F8FF",
  cardBorder:
    Platform.OS === "ios" ? "rgba(0, 0, 0, 0.08)" : "rgba(0, 0, 0, 0.05)",
  border: "rgba(0, 0, 0, 0.10)",
  text: "#111A3A",
  textSecondary: "#4D5D93",
  textMuted: "#6274AA",
  white: "#FFFFFF",
  primary: "#5A58F5",
  secondary: "#1F8DFF",
  accent: "#DDE7FF",
  accentSoft: "#EAF0FF",
  accentStrong: "#CCD8FF",
 positive: "#22B487",
  neutral: "#D8A437",
  negative: "#EE6B82",
  success: "#079B67",
  error: "#D54867",
  info: "#1F8DFF",
  overlay: "rgba(18, 26, 61, 0.35)",
  skeleton: "rgba(24, 44, 106, 0.10)",
  tabBar: "rgba(255, 255, 255, 0.96)",
  chip: "rgba(31, 54, 133, 0.08)",
  chartGrid: "rgba(29, 50, 117, 0.12)",
  gradients: {
    screen: [
      "rgb(245, 245, 245)",
      "rgb(245, 245, 245)",
      "rgb(245, 245, 245)",
    ] as const,
    hero: ["#DDE5FF", "#EEF3FF", "#F7F9FF"] as const,
    card: ["rgba(90, 88, 245, 0.10)", "rgba(31, 141, 255, 0.01)"] as const,
  },
};

export const Colors = darkColors;
