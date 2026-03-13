import { Platform } from "react-native";

export const Colors = {
  // background: "#f8f8f8ff",
  background: "rgb(245, 245, 245)",

  primary: "#2563eb",
  accent: "#eff3fc",
  surface: "#f8f8f8",
  white: "#fff",
  text: "#1f2937",
  textSecondary: "#6b7280",
  cardBorder:
    Platform.OS === "ios" ? "rgba(0, 0, 0, 0.08)" : "rgba(0, 0, 0, 0.05)",
  border: "rgba(0, 0, 0, 0.10)",
  success: "#10b981",
  error: "#ef4444",
  card: "#ffffff",
  lightPurple: "#e0e7ff",
  warning: "#f59e0b",
  muted: "#94a3b8",
  glass: "rgba(255, 255, 255, 0.8)",
};
