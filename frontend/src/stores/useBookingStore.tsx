import { create } from "zustand";
import api from "../lib/axios";



const useBookingStore = create((set) => ({
    allBookings: null,
    booking: null,
    loading: false,

    fetchAllBookings: async () => {
        set({loading: true})

        try {
            const res = await api.get('/booking/my-bookings', {withCredentials: true})
            set({allBookings: res.data.bookings, loading: false})
        } catch (error) {
            set({loading: false})
        } finally {
            set({loading: false})
        }
    },

}))

export default useBookingStore