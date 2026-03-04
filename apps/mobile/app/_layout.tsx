import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from "@expo-google-fonts/outfit";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Redirect, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { toastConfig } from "@/components/ui/ToastConfig";
import {
  AuthProvider,
  useAuth,
  getGlobalAuthToken,
  globalLogout,
} from "@/context/AuthContext";
import { TenantProvider } from "@/context/TenantContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getBaseUrl, trpc } from "@/utils/api";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error: any) => {
            if (
              error?.data?.httpStatus === 401 ||
              error?.shape?.code === -32001
            ) {
              console.log("Session expired, logging out...");
              globalLogout();
              Toast.show({
                type: "error",
                text1: "Session Expired",
                text2: "Please login again.",
              });
            }
          },
        }),
        defaultOptions: {
          queries: {
            retry: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpLink({
          url: `${getBaseUrl()}/trpc`,
          async headers() {
            const token = await getGlobalAuthToken();
            return {
              authorization: token ? `Bearer ${token}` : "",
            };
          },
        }),
      ],
    }),
  );

  if (!loaded) {
    return null;
  }

  return (
    <>
      <AuthProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <TenantProvider>
              <AuthBootstrapGate>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <BottomSheetModalProvider>
                    <SafeAreaProvider>
                      <ThemeProvider
                        value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                      >
                        <Stack initialRouteName="login" screenOptions={{ headerShown: false }}>
                          <Stack.Screen name="dashboard" />
                          <Stack.Screen name="complaint" />
                          <Stack.Screen name="receipts" />
                        </Stack>
                        <StatusBar style="auto" />
                      </ThemeProvider>
                    </SafeAreaProvider>
                  </BottomSheetModalProvider>
                </GestureHandlerRootView>
              </AuthBootstrapGate>
            </TenantProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </AuthProvider>
      <Toast config={toastConfig} />
    </>
  );
}

function AuthBootstrapGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, postLoginInitializing } = useAuth();
  const segments = useSegments();
  const firstSegment = segments[0] ?? "";
  const isPublicRoute =
    firstSegment === "login" || firstSegment === "verify-otp";

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated && !isPublicRoute) {
    return <Redirect href="/login" />;
  }

  if (isAuthenticated && isPublicRoute && !postLoginInitializing) {
    return <Redirect href="/dashboard" />;
  }

  return <>{children}</>;
}
