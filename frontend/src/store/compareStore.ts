import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompareProperty {
  id: number;
  title: Record<string, string>;
  price: number;
  location: string;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  is_featured: boolean;
  images: { id: number; image_path: string; is_primary: boolean }[];
  user: { id: number; name: string };
}

interface CompareState {
  properties: CompareProperty[];
  addProperty: (property: CompareProperty) => void;
  removeProperty: (propertyId: number) => void;
  clearAll: () => void;
  isInCompare: (propertyId: number) => boolean;
}

const MAX_COMPARE = 4;

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      properties: [],

      addProperty: (property) => {
        const { properties } = get();
        if (properties.length >= MAX_COMPARE) return;
        if (properties.some((p) => p.id === property.id)) return;
        set({ properties: [...properties, property] });
      },

      removeProperty: (propertyId) => {
        set((state) => ({
          properties: state.properties.filter((p) => p.id !== propertyId),
        }));
      },

      clearAll: () => {
        set({ properties: [] });
      },

      isInCompare: (propertyId) => {
        return get().properties.some((p) => p.id === propertyId);
      },
    }),
    {
      name: 'compare-storage',
    }
  )
);
