import { create } from 'zustand';
import { Origin, Destination, CargoType, VesselType, ForecastHorizon, Vessel } from '../types';

interface AppStore {
  // Global Filters
  origin: Origin;
  destination: Destination;
  cargo: CargoType;
  vesselType: VesselType;
  dateRange: ForecastHorizon;
  setOrigin: (origin: Origin) => void;
  setDestination: (destination: Destination) => void;
  setCargo: (cargo: CargoType) => void;
  setVesselType: (vesselType: VesselType) => void;
  setDateRange: (dateRange: ForecastHorizon) => void;
  resetFilters: () => void;

  // UI Drawer & Modal States
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  
  isCopilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;

  selectedVessel: Vessel | null;
  setSelectedVessel: (vessel: Vessel | null) => void;

  unreadAlertsCount: number;
  setUnreadAlertsCount: (count: number) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Default demo scenario (§4)
  origin: 'Australia',
  destination: 'Visakhapatnam',
  cargo: 'Coal',
  vesselType: 'Panamax',
  dateRange: '30D',

  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setCargo: (cargo) => set({ cargo }),
  setVesselType: (vesselType) => set({ vesselType }),
  setDateRange: (dateRange) => set({ dateRange }),
  resetFilters: () =>
    set({
      origin: 'Australia',
      destination: 'Visakhapatnam',
      cargo: 'Coal',
      vesselType: 'Panamax',
      dateRange: '30D',
    }),

  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

  isCopilotOpen: false,
  setCopilotOpen: (open) => set({ isCopilotOpen: open }),

  selectedVessel: null,
  setSelectedVessel: (vessel) => set({ selectedVessel: vessel }),

  unreadAlertsCount: 2,
  setUnreadAlertsCount: (count) => set({ unreadAlertsCount: count }),
}));
