import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo , useSyncExternalStore } from "react";
import { useProperty } from "./PropertyContext";

export type RoomsStatus = "all" | "available" | "occupied";
export type RentsStatus = "paid" | "due";

export interface PropertyFilters {
  rooms: { status: RoomsStatus };
  rents: { status: RentsStatus };
}

export type FiltersState = Record<string, PropertyFilters>;

type FilterAction =
  | {
      type: "SET_ROOMS_STATUS";
      payload: { propertyId: string; status: RoomsStatus };
    }
  | {
      type: "SET_RENTS_STATUS";
      payload: { propertyId: string; status: RentsStatus };
    }
  | {
      type: "RESET_PROPERTY_FILTERS";
      payload: { propertyId: string };
    };

const STORAGE_KEY = "property_scoped_filters_v1";

const defaultPropertyFilters = (): PropertyFilters => ({
  rooms: { status: "all" },
  rents: { status: "due" },
});

const filtersReducer = (state: FiltersState, action: FilterAction): FiltersState => {
  const { propertyId } = action.payload;
  const current = state[propertyId] ?? defaultPropertyFilters();

  switch (action.type) {
    case "SET_ROOMS_STATUS":
      return {
        ...state,
        [propertyId]: {
          ...current,
          rooms: { status: action.payload.status },
        },
      };
    case "SET_RENTS_STATUS":
      return {
        ...state,
        [propertyId]: {
          ...current,
          rents: { status: action.payload.status },
        },
      };
    case "RESET_PROPERTY_FILTERS":
      return {
        ...state,
        [propertyId]: defaultPropertyFilters(),
      };
    default:
      return state;
  }
};

type Listener = () => void;

class FilterStore {
  private state: FiltersState = {};
  private listeners = new Set<Listener>();
  private hydrated = false;

  getState = () => this.state;
  isHydrated = () => this.hydrated;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit = () => {
    for (const listener of this.listeners) {
      listener();
    }
  };

  hydrate = (state: FiltersState) => {
    this.state = state;
    this.hydrated = true;
    this.emit();
  };

  dispatch = (action: FilterAction) => {
    const next = filtersReducer(this.state, action);
    if (next !== this.state) {
      this.state = next;
      this.emit();
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)).catch(() => {
        // No-op: persistence failure should not block UI interaction.
      });
    }
  };
}

const FilterStoreContext = createContext<FilterStore | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => new FilterStore(), []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;

        if (!raw) {
          store.hydrate({});
          return;
        }

        const parsed = JSON.parse(raw) as FiltersState;
        store.hydrate(parsed && typeof parsed === "object" ? parsed : {});
      } catch {
        if (mounted) {
          store.hydrate({});
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [store]);

  return (
    <FilterStoreContext.Provider value={store}>
      {children}
    </FilterStoreContext.Provider>
  );
}

const useFilterStore = () => {
  const store = useContext(FilterStoreContext);
  if (!store) {
    throw new Error("Filter hooks must be used within FilterProvider");
  }
  return store;
};

function useFilterSelector<T>(selector: (state: FiltersState) => T): T {
  const store = useFilterStore();
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

export function useRoomsFilter() {
  const { selectedPropertyId } = useProperty();
  const store = useFilterStore();

  const status = useFilterSelector((state) => {
    if (!selectedPropertyId) return "all";
    return state[selectedPropertyId]?.rooms.status ?? "all";
  });

  const isHydrated = useSyncExternalStore(store.subscribe, store.isHydrated);

  const setStatus = (nextStatus: RoomsStatus) => {
    if (!selectedPropertyId) return;
    store.dispatch({
      type: "SET_ROOMS_STATUS",
      payload: { propertyId: selectedPropertyId, status: nextStatus },
    });
  };

  const resetPropertyFilters = () => {
    if (!selectedPropertyId) return;
    store.dispatch({
      type: "RESET_PROPERTY_FILTERS",
      payload: { propertyId: selectedPropertyId },
    });
  };

  return { status, setStatus, resetPropertyFilters, isHydrated };
}

export function useRentsFilter() {
  const { selectedPropertyId } = useProperty();
  const store = useFilterStore();

  const status = useFilterSelector((state) => {
    if (!selectedPropertyId) return "due";
    const stored = state[selectedPropertyId]?.rents.status;
    return stored === "paid" || stored === "due" ? stored : "due";
  });

  const isHydrated = useSyncExternalStore(store.subscribe, store.isHydrated);

  const setStatus = (nextStatus: RentsStatus) => {
    if (!selectedPropertyId) return;
    store.dispatch({
      type: "SET_RENTS_STATUS",
      payload: { propertyId: selectedPropertyId, status: nextStatus },
    });
  };

  const resetPropertyFilters = () => {
    if (!selectedPropertyId) return;
    store.dispatch({
      type: "RESET_PROPERTY_FILTERS",
      payload: { propertyId: selectedPropertyId },
    });
  };

  return { status, setStatus, resetPropertyFilters, isHydrated };
}
