import { Platform } from "react-native";

export const CardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  android: {
    elevation: 0.4,
  },
  default: {},
});

export const SoftShadow = Platform.select({
  ios: {
    shadowColor: "#7C5CFF",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 30,
  },
  android: {
    elevation: 5,
  },
  default: {},
});
