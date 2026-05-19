import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ListingCardData } from '../../components/shared/ListingCard';

export const COMPARE_MIN_ITEMS = 2;
export const COMPARE_MAX_ITEMS = 3;

export type CompareItem = ListingCardData;

type CompareState = {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (slug: string) => void;
  toggleItem: (item: CompareItem) => void;
  clear: () => void;
  isSelected: (slug: string) => boolean;
};

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          if (state.items.some((existing) => existing.slug === item.slug)) return state;
          if (state.items.length >= COMPARE_MAX_ITEMS) return state;
          return { items: [...state.items, item] };
        }),
      removeItem: (slug) =>
        set((state) => ({
          items: state.items.filter((item) => item.slug !== slug),
        })),
      toggleItem: (item) => {
        if (get().isSelected(item.slug)) {
          get().removeItem(item.slug);
          return;
        }
        get().addItem(item);
      },
      clear: () => set({ items: [] }),
      isSelected: (slug) => get().items.some((item) => item.slug === slug),
    }),
    {
      name: 'growth-world-compare',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
