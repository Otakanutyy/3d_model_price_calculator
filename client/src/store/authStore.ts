import { create } from "zustand";
import api from "@/api/client";

interface AuthState {
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  email: localStorage.getItem("user_email"),
  isAuthenticated: !!localStorage.getItem("access_token"),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post("/auth/login", { email, password });
      const { access_token, refresh_token } = res.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user_email", email);
      set({ email, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true });
    try {
      await api.post("/auth/register", { email, password });
      // Auto-login after registration
      const res = await api.post("/auth/login", { email, password });
      const { access_token, refresh_token } = res.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user_email", email);
      set({ email, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_email");
    set({ email: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const token = localStorage.getItem("access_token");
    set({ isAuthenticated: !!token });
  },
}));
