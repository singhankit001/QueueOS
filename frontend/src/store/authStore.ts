import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Manager {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  manager: Manager | null;
  setAuth: (manager: Manager) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      manager: null,
      setAuth: (manager) => {
        set({ manager });
      },
      logout: () => {
        set({ manager: null });
      },
    }),
    {
      name: 'qos-auth-storage',
    }
  )
);
