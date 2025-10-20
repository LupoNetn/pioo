import { create } from "zustand";
import api from "../lib/axios";
import { toast } from "sonner";

interface AuthStore {
  user: any | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshToken: string | null;
  fetchUser: () => Promise<void>;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: false, // 👈 start as false, only true when fetching
  isAuthenticated: false,
  refreshToken: null,

  // fetchUser: async () => {
  //   set({ loading: true }); // 👈 mark start of request
  //   try {
  //     const res = await api.get("/user/", { withCredentials: true });

  //     set({
  //       user: res.data.user,
  //       isAuthenticated: true,
  //       loading: false
  //     });
  //   } catch (err) {
  //     console.error("Fetch user failed:", err);
  //     set({
  //       user: null,
  //       isAuthenticated: false,
  //       refreshToken: null,
  //       loading: false
  //     });
  //   } finally {
  //     set({ loading: false }); // 👈 always turn off loading
  //   }
  // },

  fetchUser: async () => {
    set({ loading: true })

   try {
     const res = await api.get('/user/', {withCredentials: true})
    set({
      user: res.data.user,
      loading: false,
    })
   } catch (error: any) {
     console.error("Failed to fetch user:", error.response?.data || error.message);
     set({
      user: null,
      loading: false
     })
   }
  },

  login: async (data) => {
    set({ loading: true });
    try {
      const res = await api.post("/auth/login", data, {
        withCredentials: true,
      });

      set({
        refreshToken: res.data.refreshToken,
        isAuthenticated: true,
        user: res.data.user || null,
      });

      toast.success("Logged in successfully!");
      window.location.href = "/booking";
    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error(error.response?.data?.message || "Login failed. Try again!");
      set({ isAuthenticated: false, refreshToken: null });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      set({
        user: null,
        isAuthenticated: false,
        refreshToken: null,
      });
      toast.success("Logged out successfully!");
      window.location.href = "/auth/login";
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Logout failed. Try again!");
    } finally {
      set({ loading: false });
    }
  },
}));

export default useAuthStore;
