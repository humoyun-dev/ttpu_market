"use client";

import { create } from "zustand";

type FiltersStore = {
  ordersStatus: string | null;
  setOrdersStatus: (status: string | null) => void;
};

export const useFiltersStore = create<FiltersStore>((set) => ({
  ordersStatus: null,
  setOrdersStatus: (ordersStatus) => set({ ordersStatus }),
}));

