import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";
import { createServerTrpcClient } from "@/utils/api";

interface User {
  id: string;
  name: string;
  phoneNumber: string | null;
  roles?: UserRole[];
  needsOnboarding?: boolean;
  activeRole?: UserRole | null;
}

export type UserRole = "VENDOR" | "RESIDENT";

interface LoginIdentity {
  userId: string;
  roles: UserRole[];
  needsOnboarding: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  postLoginInitializing: boolean;
  setPostLoginInitializing: (value: boolean) => void;
  login: (token: string, user: User, identity?: LoginIdentity) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  postLoginInitializing: false,
  setPostLoginInitializing: () => {},
  login: async () => {},
  logout: async () => {},
  switchRole: async () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY_TOKEN = "auth_token";
const STORAGE_KEY_USER = "auth_user";
const STORAGE_KEY_PROPERTY = "selected_property_id";
const STORAGE_KEY_ACTIVE_ROLE = "active_role";

// Helper to handle storage differences (SecureStore is not available on web)
const setItem = async (key: string, value: string) => {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getItem = async (key: string) => {
  if (Platform.OS === "web") {
    return await AsyncStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const removeItem = async (key: string) => {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

// Global accessors for referencing outside React tree (e.g. in _layout.tsx)
let globalAuthToken: string | null = null;
let globalAuthTokenHydrated = false;

export const getGlobalAuthToken = async () => {
  if (globalAuthTokenHydrated) {
    return globalAuthToken;
  }
  const storedToken = await getItem(STORAGE_KEY_TOKEN);
  globalAuthToken = storedToken ?? null;
  globalAuthTokenHydrated = true;
  return globalAuthToken;
};

let globalLogoutInstance: () => Promise<void> = async () => {};

export const globalLogout = async () => {
  await globalLogoutInstance();
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [postLoginInitializing, setPostLoginInitializingState] =
    useState(false);
  const router = useRouter();

  // Load auth state on startup
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const storedToken = await getItem(STORAGE_KEY_TOKEN);
      const storedUser = await getItem(STORAGE_KEY_USER);
      const storedActiveRole = await AsyncStorage.getItem(
        STORAGE_KEY_ACTIVE_ROLE,
      );

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        if (
          storedActiveRole &&
          parsedUser.roles?.includes(storedActiveRole as UserRole)
        ) {
          parsedUser.activeRole = storedActiveRole as UserRole;
        }
        setToken(storedToken);
        globalAuthToken = storedToken;
        globalAuthTokenHydrated = true;
        setUser(parsedUser);
      } else {
        globalAuthToken = null;
        globalAuthTokenHydrated = true;
      }
    } catch (e) {
      console.error("Failed to load auth state", e);
    } finally {
      setPostLoginInitializingState(false);
      setIsLoading(false);
    }
  };

  const login = async (
    newToken: string,
    newUser: User,
    identity?: LoginIdentity,
  ) => {
    try {
      const roles = identity?.roles ?? newUser.roles ?? [];
      const activeRole =
        roles.length > 0
          ? newUser.activeRole && roles.includes(newUser.activeRole)
            ? newUser.activeRole
            : roles[0]
          : null;

      const mergedUser: User = {
        ...newUser,
        roles,
        needsOnboarding:
          identity?.needsOnboarding ?? newUser.needsOnboarding ?? false,
        activeRole,
      };

      setToken(newToken);
      globalAuthToken = newToken;
      globalAuthTokenHydrated = true;
      setUser(mergedUser);
      await setItem(STORAGE_KEY_TOKEN, newToken);
      await setItem(STORAGE_KEY_USER, JSON.stringify(mergedUser));
      if (activeRole) {
        await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_ROLE, activeRole);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_ROLE);
      }
    } catch (e) {
      console.error("Failed to save auth state", e);
    }
  };

  const switchRole = async (role: UserRole) => {
    if (!user?.roles?.includes(role)) {
      return;
    }

    const updatedUser: User = {
      ...user,
      activeRole: role,
    };

    setUser(updatedUser);
    await setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_ROLE, role);
  };

  const logout = useCallback(async () => {
    try {
      const currentToken = token;
      if (currentToken) {
        await createServerTrpcClient(currentToken)
          .auth.logout.mutate()
          .catch(() => null);
      }

      setToken(null);
      globalAuthToken = null;
      globalAuthTokenHydrated = true;
      setPostLoginInitializingState(false);
      setUser(null);
      await removeItem(STORAGE_KEY_TOKEN);
      await removeItem(STORAGE_KEY_USER);
      await AsyncStorage.removeItem(STORAGE_KEY_PROPERTY);
      await AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_ROLE);
      router.replace("/login");
    } catch (e) {
      console.error("Failed to clear auth state", e);
    }
  }, [router, token]);

  const setPostLoginInitializing = useCallback((value: boolean) => {
    setPostLoginInitializingState(value);
  }, []);

  // Assign instance to global variable
  useEffect(() => {
    globalLogoutInstance = logout;
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        postLoginInitializing,
        setPostLoginInitializing,
        login,
        logout,
        switchRole,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
