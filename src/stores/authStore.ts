import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AuthState } from '../types/auth.types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      location: 'India',
      coordinates: undefined,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setLocation: (location) => set({ location }),

      setCoordinates: (coordinates) => set({ coordinates }),

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          location: 'India',
          coordinates: undefined,
        });
        localStorage.clear();
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        location: state.location,
        coordinates: state.coordinates,
      }),
    }
  )
);