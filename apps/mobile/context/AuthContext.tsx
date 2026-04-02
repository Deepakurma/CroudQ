import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerAuthRefreshHandler, setAuthTokens, trpc } from "@/utils/api";
import * as ExpoLinking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Linking } from "react-native";
import Toast from "react-native-toast-message";

interface User {
  id: string;
  name: string | null;
  email: string;
  handle: string | null;
  tier: string | null;
  subscriptionState: "active" | "ended" | "none";
  deletionRequestedAt: string | null;
  scheduledDeletionAt: string | null;
}

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface LegacyAuthSession {
  token: string;
  user: User;
}

interface YoutubeConnection {
  isConnected: boolean;
  channelId: string | null;
  channelName: string | null;
  videosCount: number;
  commentsCount: number;
  lastSyncedAt: string | null;
}

export type HomePlatform = "youtube" | "instagram";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
  youtubeConnection: YoutubeConnection;
  selectedHomePlatform: HomePlatform;
  isYouTubeConnecting: boolean;
  isYouTubeSyncing: boolean;
  isYouTubeSyncAvailable: boolean;
  youtubeLastSyncedLabel: string;
  login: (input: { email: string; password: string }) => Promise<void>;
  requestSignupOtp: (input: {
    name?: string;
    email: string;
    password: string;
  }) => Promise<void>;
  verifySignupOtp: (input: { email: string; code: string }) => Promise<void>;
  signup: (input: {
    name?: string;
    email: string;
    password: string;
  }) => Promise<void>;
  updateProfile: (input: {
    name: string;
    email: string;
    currentPassword: string;
  }) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  requestAccountDeletion: () => Promise<void>;
  cancelAccountDeletion: () => Promise<void>;
  openUpgradePage: () => Promise<void>;
  logout: () => Promise<void>;
  connectYouTube: () => Promise<void>;
  disconnectYouTube: () => Promise<void>;
  syncYouTube: () => Promise<void>;
  setSelectedHomePlatform: (platform: HomePlatform) => Promise<void>;
  handleIncomingRedirect: (url: string) => Promise<boolean>;
  refreshYoutubeConnection: () => Promise<boolean>;
}

const STORAGE_KEY = "croudq_session";
const YOUTUBE_STORAGE_KEY = "croudq_youtube_connection";
const HOME_PLATFORM_STORAGE_KEY = "croudq_home_platform";

const defaultYoutubeConnection: YoutubeConnection = {
  isConnected: false,
  channelId: null,
  channelName: null,
  videosCount: 0,
  commentsCount: 0,
  lastSyncedAt: null,
};

const SYNC_COOLDOWN_MS = 60 * 60 * 1000;

const formatLastSyncedLabel = (value: string | null, now: number) => {
  if (!value) {
    return "Not synced yet";
  }

  const diffMs = now - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

const showYoutubeErrorToast = (message: string) => {
  Toast.show({
    type: "error",
    text1: "YouTube",
    text2: message,
  });
};

const showAuthToast = (
  type: "success" | "error",
  text1: string,
  text2: string,
) => {
  Toast.show({
    type,
    text1,
    text2,
  });
};

const getFriendlyAuthMessage = (message: string) => {
  if (message.includes("Invalid email or password")) {
    return "Invalid email or password.";
  }

  if (message.includes("already exists")) {
    return "An account with this email already exists.";
  }

  if (message.includes("Current password is incorrect")) {
    return "Current password is incorrect.";
  }

  if (message.includes("Too many sign-in attempts")) {
    return "Too many sign-in attempts. Please try again later.";
  }

  if (message.includes("Too many sign-up attempts")) {
    return "Too many sign-up attempts. Please try again later.";
  }

  if (message.includes("Too many reset requests")) {
    return "Too many reset requests. Please try again later.";
  }

  if (message.includes("Password reset is not configured")) {
    return "Password reset is not available right now.";
  }

  if (message.includes("verification code is invalid or expired")) {
    return "This verification code is invalid or has expired.";
  }

  if (
    message.includes("password reset link is invalid or expired") ||
    message.includes("Reset token")
  ) {
    return "This reset link is invalid or has expired.";
  }

  return "Something went wrong. Please try again.";
};

const getFriendlyYoutubeMessage = (message: string) => {
  if (
    message.includes("not configured") ||
    message.includes("Missing OAuth URL")
  ) {
    return "YouTube connection is not set up yet.";
  }

  if (message.includes("You need to be logged in first")) {
    return "Please log in first.";
  }

  if (message.includes("Could not start")) {
    return "Could not start the YouTube connection.";
  }

  if (message.includes("Could not load") || message.includes("not connected")) {
    return "Could not load your YouTube connection.";
  }

  if (message.includes("not completed")) {
    return "YouTube connection was not completed.";
  }

  if (message.includes("Could not sync")) {
    return "Could not sync your YouTube data right now.";
  }

  if (message.includes("Could not disconnect")) {
    return "Could not disconnect your YouTube account. Please try again.";
  }

  if (
    message.includes("available every 1 hour") ||
    message.includes("every 10 mins")
  ) {
    return "Sync is available every 1 hour.";
  }

  if (message.includes("Could not connect")) {
    return "Could not connect your YouTube account.";
  }

  return "Something went wrong. Please try again.";
};

const shouldClearSessionOnRefreshFailure = (message: string) =>
  message.includes("Refresh session is invalid or expired");

const isLegacySession = (
  session: AuthSession | LegacyAuthSession,
): session is LegacyAuthSession =>
  !("accessToken" in session && "refreshToken" in session);

const shouldClearYoutubeConnectionState = (message: string) =>
  message.includes("YouTube account is not connected") ||
  message.includes("Not authenticated") ||
  message.includes("UNAUTHORIZED");

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hasActiveSubscription: false,
  youtubeConnection: defaultYoutubeConnection,
  selectedHomePlatform: "youtube",
  isYouTubeConnecting: false,
  isYouTubeSyncing: false,
  isYouTubeSyncAvailable: false,
  youtubeLastSyncedLabel: "Not synced yet",
  login: async () => {},
  requestSignupOtp: async () => {},
  verifySignupOtp: async () => {},
  signup: async () => {},
  updateProfile: async () => {},
  requestPasswordReset: async () => {},
  requestAccountDeletion: async () => {},
  cancelAccountDeletion: async () => {},
  openUpgradePage: async () => {},
  logout: async () => {},
  connectYouTube: async () => {},
  disconnectYouTube: async () => {},
  syncYouTube: async () => {},
  setSelectedHomePlatform: async () => {},
  handleIncomingRedirect: async () => false,
  refreshYoutubeConnection: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [youtubeConnection, setYoutubeConnection] = useState<YoutubeConnection>(
    defaultYoutubeConnection,
  );
  const [selectedHomePlatform, setSelectedHomePlatformState] =
    useState<HomePlatform>("youtube");
  const [isYouTubeConnecting, setIsYouTubeConnecting] = useState(false);
  const [isYouTubeSyncing, setIsYouTubeSyncing] = useState(false);
  const [cooldownNow, setCooldownNow] = useState(() => Date.now());
  const refreshSessionRunnerRef = useRef<
    (refreshToken: string) => Promise<AuthSession | null>
  >(async () => null);
  const lastRefreshFailureWasInvalidRef = useRef(false);
  const loginMutation = useMutation(trpc.auth.login.mutationOptions());
  const signupMutation = useMutation(trpc.auth.signup.mutationOptions());
  const verifySignupOtpMutation = useMutation(
    trpc.auth.verifySignupOtp.mutationOptions(),
  );
  const updateProfileMutation = useMutation(
    trpc.auth.updateProfile.mutationOptions(),
  );
  const logoutMutation = useMutation(trpc.auth.logout.mutationOptions());
  const refreshSessionMutation = useMutation(
    trpc.auth.refreshSession.mutationOptions(),
  );
  const requestPasswordResetMutation = useMutation(
    trpc.auth.requestPasswordReset.mutationOptions(),
  );
  const requestAccountDeletionMutation = useMutation(
    trpc.auth.requestAccountDeletion.mutationOptions(),
  );
  const cancelAccountDeletionMutation = useMutation(
    trpc.auth.cancelAccountDeletion.mutationOptions(),
  );
  const createUpgradeLinkMutation = useMutation(
    trpc.auth.createUpgradeLink.mutationOptions(),
  );
  const disconnectYouTubeMutation = useMutation(
    trpc.youtube.disconnect.mutationOptions(),
  );
  const youtubeSyncMutation = useMutation(trpc.youtube.sync.mutationOptions());
  const isYouTubeSyncAvailable =
    youtubeConnection.isConnected &&
    (!youtubeConnection.lastSyncedAt ||
      cooldownNow - new Date(youtubeConnection.lastSyncedAt).getTime() >=
        SYNC_COOLDOWN_MS);
  const youtubeLastSyncedLabel = formatLastSyncedLabel(
    youtubeConnection.lastSyncedAt,
    cooldownNow,
  );
  const hasActiveSubscription = user?.subscriptionState === "active";

  useEffect(() => {
    if (!youtubeConnection.lastSyncedAt) {
      return;
    }

    const interval = setInterval(() => {
      setCooldownNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [youtubeConnection.lastSyncedAt]);

  const persistYoutubeConnection = async (nextState: YoutubeConnection) => {
    setYoutubeConnection(nextState);
    await AsyncStorage.setItem(YOUTUBE_STORAGE_KEY, JSON.stringify(nextState));
  };

  const setSelectedHomePlatform = async (platform: HomePlatform) => {
    setSelectedHomePlatformState(platform);
    await AsyncStorage.setItem(HOME_PLATFORM_STORAGE_KEY, platform);
  };

  const refreshYoutubeConnection = async ({
    silent = false,
  }: {
    silent?: boolean;
  } = {}) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!token) {
      return false;
    }

    try {
      const payload = await queryClient.fetchQuery(
        trpc.youtube.data.queryOptions({}),
      );

      await persistYoutubeConnection({
        isConnected: true,
        channelId: payload.channel.id,
        channelName: payload.channel.title,
        videosCount: payload.videos.length,
        commentsCount: payload.commentsCount,
        lastSyncedAt: payload.lastSyncedAt
          ? payload.lastSyncedAt.toISOString()
          : null,
      });
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load YouTube data";

      if (shouldClearYoutubeConnectionState(message)) {
        await persistYoutubeConnection({
          ...defaultYoutubeConnection,
        });
      }

      if (!silent) {
        showYoutubeErrorToast(getFriendlyYoutubeMessage(message));
      }

      return false;
    }
  };

  const persistSession = async (session: AuthSession) => {
    setAuthTokens({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    setUser(session.user);
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
  };

  const persistCurrentUser = async (nextUser: User) => {
    setUser(nextUser);

    const storedSession = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!storedSession) {
      return;
    }

    const session = JSON.parse(storedSession) as AuthSession;
    await SecureStore.setItemAsync(
      STORAGE_KEY,
      JSON.stringify({
        ...session,
        user: nextUser,
      } satisfies AuthSession),
    );
  };

  const refreshCurrentUserFromServer = async () => {
    const nextUser = await queryClient.fetchQuery(trpc.auth.me.queryOptions());
    await persistCurrentUser(nextUser);
    return nextUser;
  };

  const clearSession = async () => {
    setAuthTokens({
      accessToken: null,
      refreshToken: null,
    });
    setUser(null);
    setYoutubeConnection(defaultYoutubeConnection);
    setSelectedHomePlatformState("youtube");
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEY),
      AsyncStorage.removeItem(YOUTUBE_STORAGE_KEY),
      AsyncStorage.removeItem(HOME_PLATFORM_STORAGE_KEY),
    ]);
  };

  refreshSessionRunnerRef.current = async (refreshToken: string) => {
    try {
      lastRefreshFailureWasInvalidRef.current = false;
      const refreshedSession = await refreshSessionMutation.mutateAsync({
        refreshToken,
      });
      await persistSession(refreshedSession);
      return refreshedSession;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (shouldClearSessionOnRefreshFailure(message)) {
        lastRefreshFailureWasInvalidRef.current = true;
        await clearSession();
      }
      return null;
    }
  };

  useEffect(() => {
    registerAuthRefreshHandler(async (refreshToken) => {
      const refreshedSession =
        (await refreshSessionRunnerRef.current?.(refreshToken)) ?? null;
      if (!refreshedSession && lastRefreshFailureWasInvalidRef.current) {
        queryClient.clear();
      }

      return refreshedSession
        ? {
            accessToken: refreshedSession.accessToken,
            refreshToken: refreshedSession.refreshToken,
          }
        : null;
    });

    return () => {
      registerAuthRefreshHandler(null);
    };
  }, [queryClient]);

  useEffect(() => {
    const hydrate = async () => {
      const [storedSession, storedYoutube, storedHomePlatform] =
        await Promise.all([
          SecureStore.getItemAsync(STORAGE_KEY),
          AsyncStorage.getItem(YOUTUBE_STORAGE_KEY),
          AsyncStorage.getItem(HOME_PLATFORM_STORAGE_KEY),
        ]);
      let shouldRestoreLocalPreferences = true;

      if (storedSession) {
        const parsedSession = JSON.parse(storedSession) as
          | AuthSession
          | LegacyAuthSession;
        if (isLegacySession(parsedSession)) {
          await clearSession();
          shouldRestoreLocalPreferences = false;
          setIsLoading(false);
          return;
        }

        const session: AuthSession = parsedSession;
        setAuthTokens({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken || null,
        });
        setUser(session.user);

        try {
          const currentUser = await queryClient.fetchQuery(
            trpc.auth.me.queryOptions(),
          );
          await persistCurrentUser(currentUser);

          await refreshYoutubeConnection({ silent: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : "";

          // The tRPC client already attempts a single refresh on unauthorized
          // responses. If the request still fails here, the session is no
          // longer recoverable and a second refresh attempt would reuse a stale
          // rotated refresh token.
          if (shouldClearSessionOnRefreshFailure(message)) {
            await clearSession();
            shouldRestoreLocalPreferences = false;
          }
        }
      }

      if (shouldRestoreLocalPreferences && storedYoutube) {
        setYoutubeConnection(JSON.parse(storedYoutube) as YoutubeConnection);
      }

      if (
        shouldRestoreLocalPreferences &&
        (storedHomePlatform === "youtube" || storedHomePlatform === "instagram")
      ) {
        setSelectedHomePlatformState(storedHomePlatform);
      }

      setIsLoading(false);
    };

    void hydrate();
  }, [queryClient]);

  const login = async (input: { email: string; password: string }) => {
    try {
      const session = await loginMutation.mutateAsync(input);
      await persistSession(session);
      await refreshYoutubeConnection({ silent: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not sign in";
      showAuthToast("error", "Sign in failed", getFriendlyAuthMessage(message));
      throw error;
    }
  };

  const requestSignupOtp = async (input: {
    name?: string;
    email: string;
    password: string;
  }) => {
    try {
      const result = await signupMutation.mutateAsync(input);
      showAuthToast("success", "Check your email", result.message);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not send verification code";
      showAuthToast("error", "Sign up failed", getFriendlyAuthMessage(message));
      throw error;
    }
  };

  const verifySignupOtp = async (input: { email: string; code: string }) => {
    try {
      const session = await verifySignupOtpMutation.mutateAsync(input);
      await persistSession(session);
      await refreshYoutubeConnection({ silent: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not verify your email";
      showAuthToast(
        "error",
        "Verification failed",
        getFriendlyAuthMessage(message),
      );
      throw error;
    }
  };

  const signup = requestSignupOtp;

  const requestPasswordReset = async (email: string) => {
    try {
      const redirectTo = "https://croudq.com/reset-password";
      const result = await requestPasswordResetMutation.mutateAsync({
        email,
        redirectTo,
      });
      showAuthToast("success", "Check your email", result.message);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not send password reset email";
      showAuthToast("error", "Reset failed", getFriendlyAuthMessage(message));
      throw error;
    }
  };

  const requestAccountDeletion = async () => {
    try {
      const nextUser = await requestAccountDeletionMutation.mutateAsync();
      await persistCurrentUser(nextUser);
      showAuthToast(
        "success",
        "Deletion scheduled",
        "Your account is scheduled for deletion in 3 days.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not schedule deletion";
      showAuthToast("error", "Request failed", getFriendlyAuthMessage(message));
      throw error;
    }
  };

  const cancelAccountDeletion = async () => {
    try {
      const nextUser = await cancelAccountDeletionMutation.mutateAsync();
      await persistCurrentUser(nextUser);
      showAuthToast(
        "success",
        "Deletion canceled",
        "Your account will no longer be deleted.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not cancel deletion";
      showAuthToast("error", "Cancel failed", getFriendlyAuthMessage(message));
      throw error;
    }
  };

  const openUpgradePage = async () => {
    try {
      const { url } = await createUpgradeLinkMutation.mutateAsync();
      await Linking.openURL(url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not open upgrade page";
      showAuthToast(
        "error",
        "Upgrade unavailable",
        getFriendlyAuthMessage(message),
      );
      throw error;
    }
  };

  const updateProfile = async (input: {
    name: string;
    email: string;
    currentPassword: string;
  }) => {
    try {
      const nextUser = await updateProfileMutation.mutateAsync(input);
      await persistCurrentUser(nextUser);
      showAuthToast(
        "success",
        "Profile updated",
        "Your account details were saved.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not update profile";
      showAuthToast("error", "Update failed", getFriendlyAuthMessage(message));
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (user) {
        const storedSession = await SecureStore.getItemAsync(STORAGE_KEY);
        const refreshToken = storedSession
          ? ((JSON.parse(storedSession) as Partial<AuthSession>).refreshToken ??
            "")
          : "";
        await logoutMutation.mutateAsync(
          refreshToken ? { refreshToken } : undefined,
        );
      }
    } catch {
      // Clear the local session even if the revoke call fails.
    } finally {
      await clearSession();
      queryClient.clear();
    }
  };

  const connectYouTube = async () => {
    if (!user) {
      const message = "You need to be logged in first";
      showYoutubeErrorToast(getFriendlyYoutubeMessage(message));
      throw new Error(message);
    }

    setIsYouTubeConnecting(true);

    try {
      const redirectTo = ExpoLinking.createURL("/auth/youtube");
      const payload = await queryClient.fetchQuery(
        trpc.youtube.authUrl.queryOptions({
          redirectTo,
        }),
      );
      if (!payload.url) {
        throw new Error("Missing OAuth URL");
      }

      await Linking.openURL(payload.url);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not start YouTube connection";
      setIsYouTubeConnecting(false);
      showYoutubeErrorToast(getFriendlyYoutubeMessage(message));
      throw error;
    }
  };

  const disconnectYouTube = async () => {
    if (!user) {
      showYoutubeErrorToast("Please log in first.");
      return;
    }

    try {
      const result = await disconnectYouTubeMutation.mutateAsync();
      await persistYoutubeConnection({
        ...defaultYoutubeConnection,
      });
      await queryClient.removeQueries({
        predicate: (query) => {
          const key = JSON.stringify(query.queryKey);
          return key.includes('"youtube"') || key.includes('"insights"');
        },
      });
      Toast.show({
        type: "success",
        text1: "YouTube disconnected",
        text2: result.message,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not disconnect your YouTube account.";
      showYoutubeErrorToast(getFriendlyYoutubeMessage(message));
      throw error;
    }
  };

  const syncYouTube = async () => {
    if (!user) {
      showYoutubeErrorToast("Please log in first.");
      return;
    }

    if (!youtubeConnection.isConnected) {
      showYoutubeErrorToast("Connect YouTube first.");
      return;
    }

    if (!isYouTubeSyncAvailable) {
      showYoutubeErrorToast("Sync is available every 1 hour.");
      return;
    }

    setIsYouTubeSyncing(true);

    try {
      await youtubeSyncMutation.mutateAsync({});

      const refreshed = await refreshYoutubeConnection();
      if (refreshed) {
        Toast.show({
          type: "success",
          text1: "YouTube synced",
          text2: "Your latest channel data is ready.",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not sync your YouTube data right now.";
      showYoutubeErrorToast(getFriendlyYoutubeMessage(message));
    } finally {
      setIsYouTubeSyncing(false);
    }
  };

  const handleIncomingRedirect = async (url: string) => {
    const parsed = ExpoLinking.parse(url);
    const path = parsed.path?.replace(/^\/+/, "") ?? "";
    const queryParams = parsed.queryParams as Record<string, string | undefined>;

    if (path === "billing/success") {
      try {
        const nextUser = await refreshCurrentUserFromServer();
        Toast.show({
          type: "success",
          text1: "Subscription updated",
          text2:
            nextUser.subscriptionState === "active"
              ? "Your Pro access is ready to use."
              : "Your subscription is updating. Check again in a moment.",
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not refresh your subscription";
        showAuthToast("error", "Upgrade sync failed", message);
      }
      return true;
    }

    if (path !== "auth/youtube") {
      return false;
    }

    const status = queryParams.status;
    const message = queryParams.message;

    if (status === "success") {
      const refreshed = await refreshYoutubeConnection();
      setIsYouTubeConnecting(false);
      if (refreshed) {
        Toast.show({
          type: "success",
          text1: "YouTube connected",
          text2: "Your channel data is ready to use.",
        });
      }
      return true;
    }

    const errorMessage = message || "YouTube connection was not completed";
    setIsYouTubeConnecting(false);
    showYoutubeErrorToast(getFriendlyYoutubeMessage(errorMessage));
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        hasActiveSubscription,
        youtubeConnection,
        selectedHomePlatform,
        isYouTubeConnecting,
        isYouTubeSyncing,
        isYouTubeSyncAvailable,
        youtubeLastSyncedLabel,
        login,
        requestSignupOtp,
        verifySignupOtp,
        signup,
        updateProfile,
        requestPasswordReset,
        requestAccountDeletion,
        cancelAccountDeletion,
        openUpgradePage,
        logout,
        connectYouTube,
        disconnectYouTube,
        syncYouTube,
        setSelectedHomePlatform,
        handleIncomingRedirect,
        refreshYoutubeConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
