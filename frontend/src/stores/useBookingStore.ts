import { create } from "zustand";
import api from "../lib/axios";

const useBookingStore = create((set) => ({
  myBookings: null,
  allBookings: null,
  booking: null,
  loading: false,
  rescheduleBookingId: null,

  setRescheduleBookingId: (id: string | null) => {
    set({ rescheduleBookingId: id });
  },

  fetchMyBookings: async (id: string) => {
    set({ loading: true });

    try {
      const res = await api.get(`/booking/${id}/my-bookings`, {
        withCredentials: true,
      });
      set({ myBookings: res.data.bookings, loading: false });
      return res.data.bookings;
    } catch (error) {
      set({ loading: false });
    } finally {
      set({ loading: false });
    }
  },

  fetchAllBookings: async () => {
    set({ loading: true });

    try {
      const res = await api.get("/booking/", { withCredentials: true });
      set({ allBookings: res.data.bookings, loading: false });
      return res.data.bookings;
    } catch (error) {
      set({ loading: false });
    } finally {
      set({ loading: false });
    }
  },

  confirmBooking: async (id: string) => {
    try {
      const res = await api.patch(
        `/booking/${id}/approve`,
        {},
        { withCredentials: true }
      );
      return res.data;
    } catch (error) {
      console.error("Error confirming booking:", error);
    }
  },

  deleteBooking: async (id: string) => {
    try {
        set({ loading: true });
        const res = await api.delete(`/booking/${id}`, { withCredentials: true });
        return res.data;

    } catch (error) {
        console.error("Error deleting booking:", error);
    } finally {
        set({ loading: false });
    }
  }
}));

export default useBookingStore;
