import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Ref-based storage for synchronous access from tRPC client
// This ref is set by PropertyProvider and read by getGlobalPropertyId
let propertyIdRef: { current: string | null } = { current: null };
let setPropertyIdGlobal: ((id: string | null) => Promise<void>) | null = null;

// Synchronous getter for tRPC client headers
export const getGlobalPropertyId = () => propertyIdRef.current;
export const clearGlobalPropertyId = async () => {
  if (setPropertyIdGlobal) {
    await setPropertyIdGlobal(null);
  }
};

interface PropertyContextType {
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  reconcileSelectedPropertyId: (validPropertyIds: string[]) => Promise<void>;
  isLoading: boolean;
}

const PropertyContext = createContext<PropertyContextType | undefined>(
  undefined,
);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const [selectedPropertyId, setSelectedPropertyIdState] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create ref and assign to module-level ref for tRPC access
  const localRef = useRef<string | null>(null);

  const STORAGE_KEY = "selected_property_id";

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const storedId = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedId) {
          localRef.current = storedId; // Update ref FIRST
          setSelectedPropertyIdState(storedId);
        }
      } catch (e) {
        console.error("Failed to load property ID", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setSelectedPropertyId = React.useCallback(async (id: string | null) => {
    // CRITICAL: Update ref FIRST, synchronously, before any async operations
    localRef.current = id;

    // Then update React state
    setSelectedPropertyIdState(id);

    // Finally persist to storage (async, doesn't block)
    try {
      if (id) {
        await AsyncStorage.setItem(STORAGE_KEY, id);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save property ID", e);
    }
  }, []);

  const reconcileSelectedPropertyId = React.useCallback(
    async (validPropertyIds: string[]) => {
      const current = localRef.current;
      if (!current) return;
      if (validPropertyIds.includes(current)) return;
      await setSelectedPropertyId(null);
    },
    [setSelectedPropertyId],
  );

  // Make ref and setter available to app-wide consumers (tRPC headers/query cache recovery)
  useEffect(() => {
    propertyIdRef = localRef;
    setPropertyIdGlobal = setSelectedPropertyId;

    return () => {
      if (setPropertyIdGlobal === setSelectedPropertyId) {
        setPropertyIdGlobal = null;
      }
    };
  }, [setSelectedPropertyId]);

  return (
    <PropertyContext.Provider
      value={{
        selectedPropertyId,
        setSelectedPropertyId,
        reconcileSelectedPropertyId,
        isLoading,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error("useProperty must be used within a PropertyProvider");
  }
  return context;
}
