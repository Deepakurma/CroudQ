import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from "@expo-google-fonts/outfit";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import * as ExpoLinking from "expo-linking";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { toastConfig } from "@/components/ui/ToastConfig";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import {
  ThemeProvider as AppThemeProvider,
  useAppTheme,
} from "@/context/ThemeContext";
import { queryClient } from "@/utils/api";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!loaded) {
    return null;
  }

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppThemeProvider>
            <AppShell />
          </AppThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
      <Toast config={toastConfig} />
    </>
  );
}

function AppShell() {
  const { isDark, colors } = useAppTheme();
  const { handleYoutubeRedirect, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleInitialUrl = async () => {
      const initialUrl = await ExpoLinking.getInitialURL();
      if (initialUrl) {
        await handleYoutubeRedirect(initialUrl);
      }
    };

    void handleInitialUrl();

    const subscription = ExpoLinking.addEventListener("url", ({ url }) => {
      void handleYoutubeRedirect(url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleYoutubeRedirect]);

  useEffect(() => {
    if (!isLoading) {
      void SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <View style={{ flex: 1, backgroundColor: colors.background }}>
              {!isLoading ? (
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                  }}
                >
                  <Stack.Protected guard={!isAuthenticated}>
                    <Stack.Screen name="login" />
                    <Stack.Screen name="signup" />
                    <Stack.Screen name="forgot-password" />
                  </Stack.Protected>

                  <Stack.Protected guard={isAuthenticated}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="connect-account" />
                    <Stack.Screen name="auth/youtube" />
                    <Stack.Screen
                      name="videos/[id]"
                      options={{
                        presentation: "card",
                        animation: "slide_from_right",
                      }}
                    />
                  </Stack.Protected>
                </Stack>
              ) : null}
              <StatusBar style={isDark ? "light" : "dark"} />
            </View>
          </NavigationThemeProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
