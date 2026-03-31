import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppColors, darkColors, lightColors } from "@/constants/Colors";
import { Appearance } from "react-native";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "system" | "dark" | "light";
type ResolvedThemeMode = "dark" | "light";

interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  isDark: boolean;
  colors: AppColors;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = "croudq_theme_mode";

const ThemeContext = createContext<ThemeContextType>({
  mode: "system",
  resolvedMode: "dark",
  isDark: true,
  colors: darkColors,
  setMode: async () => {},
  toggleTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [deviceScheme, setDeviceScheme] = useState<ResolvedThemeMode>(
    Appearance.getColorScheme() === "light" ? "light" : "dark",
  );

  useEffect(() => {
    const hydrate = async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        setModeState(stored);
      }
    };
    hydrate();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setDeviceScheme(colorScheme === "light" ? "light" : "dark");
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const setMode = async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
  };

  const toggleTheme = async () => {
    const baseMode = mode === "system" ? deviceScheme : mode;
    const nextMode = baseMode === "dark" ? "light" : "dark";
    await setMode(nextMode);
  };

  const resolvedMode: ResolvedThemeMode = mode === "system" ? deviceScheme : mode;

  const value = useMemo<ThemeContextType>(
    () => ({
      mode,
      resolvedMode,
      isDark: resolvedMode === "dark",
      colors: resolvedMode === "dark" ? darkColors : lightColors,
      setMode,
      toggleTheme,
    }),
    [mode, resolvedMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
