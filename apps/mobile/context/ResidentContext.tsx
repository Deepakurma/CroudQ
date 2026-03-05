import { trpc } from "@/utils/api";
import { useAuth } from "./AuthContext";
import React, { createContext, useContext } from "react";

// Shape of a resident profile as returned by getMyProfile
export type ResidentProfile = {
  id: string;
  name: string;
  phoneNumber: string;
  profileImage: string | null;
  checkInDate: string;
  checkOutDate: string | null;
  nextRentDueDate: string;
  lastPaymentDate: string | null;
  rentAmount: number;
  advanceMonths: number | null;
  status: string | null;
  propertyId: string;
  roomId: string;
  room: {
    id: string;
    roomNumber: string;
    ac: boolean | null;
    type: { name: string; maxOccupancy: number | null } | null;
  };
  property: {
    id: string;
    name: string;
    inchargeName: string | null;
    inchargePhone: string | null;
    city: string | null;
    state: string | null;
  };
};

interface ResidentContextType {
  residentProfile: ResidentProfile | null | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
}

const ResidentContext = createContext<ResidentContextType>({
  residentProfile: undefined,
  isLoading: true,
  isError: false,
  refetch: async () => undefined,
});

export const useResident = () => useContext(ResidentContext);

export function ResidentProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    data: residentProfile,
    isLoading,
    isError,
    refetch,
  } = trpc.resident.getMyProfile.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
    enabled: isAuthenticated && !authLoading,
  });

  return (
    <ResidentContext.Provider
      value={{
        residentProfile,
        isLoading: authLoading || isLoading,
        isError,
        refetch,
      }}
    >
      {children}
    </ResidentContext.Provider>
  );
}
