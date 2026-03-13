import { Platform } from "react-native";

export const CardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  default: {},
});
