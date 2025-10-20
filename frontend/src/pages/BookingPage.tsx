import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema } from "../schemas/bookingSchema";
import type { BookingFormData } from "../schemas/bookingSchema";
import { Button } from "../components/ui/button";
import { CalendarDays, Clock, Music, User } from "lucide-react";
import useAuthStore from "../stores/useAuthStore";
import api from "../lib/axios";
import { toast } from "sonner";
import { useState } from "react";

const BookingPage = () => {
  const user = useAuthStore((state: any) => state.user);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

 const onSubmit = async (data: BookingFormData) => {
  if (!user || !user.id) {
    toast.error("You must be signed in to book a session.");
    console.log(user.id)
    return;
  }

  setLoading(true);
  try {
    const bookingData = {
      userId: user.id,
      date: new Date(data.date).toISOString(),
      startTime: new Date(`${data.date}T${data.startTime}`).toISOString(),
      endTime: new Date(`${data.date}T${data.endTime}`).toISOString(),
      notes: data.notes || "",
    };

    console.log("bookingData", bookingData); // 👈 check this in console

    const res = await api.post("/booking", bookingData, {
      withCredentials: true,
    });

    if (res.status === 201) {
      toast.success("Your session has been booked! Check Your profile to see all booking and booking status");
      reset();
    } else {
      toast.error("Booking failed. Try again.");
    }
  } catch (err) {
    toast.error("Something went wrong, please try again.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  return (
    <section className="app-container mt-30 font-audio text-gray-100">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 border border-border rounded-3xl overflow-hidden shadow-2xl bg-card">
        {/* LEFT COLUMN — Studio Visual / Info */}
        <div className="relative bg-gradient-to-br from-accent/10 to-transparent flex flex-col justify-center items-center p-10 text-center">
          <h2 className="text-3xl lg:text-4xl font-semibold text-accent mb-4">
            Book Your Studio Time 🎶
          </h2>
          <p className="text-gray-400 max-w-md">
            Choose your session type and preferred time. Let’s make your next
            hit sound perfect.
          </p>

          <div className="absolute inset-0 bg-[url('/studio.jpg')] bg-cover bg-center opacity-10 pointer-events-none rounded-3xl" />
        </div>

        {/* RIGHT COLUMN — Booking Form */}
        <div className="p-10 bg-card/90 backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Date */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Choose Date
              </label>
              <div className="flex items-center border-b border-border focus-within:border-accent transition">
                <CalendarDays className="text-gray-400 mr-2 w-4 h-4" />
                <input
                  {...register("date")}
                  type="date"
                  className="bg-transparent w-full p-2 outline-none text-sm text-gray-100"
                />
              </div>
              {errors.date && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>

            {/* Time Inputs Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Time */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">
                  Start Time{" "}
                  <span className="text-xs text-accent">(10:00:AM)</span>
                </label>
                <div className="flex items-center border-b border-border focus-within:border-accent transition">
                  <Clock className="text-gray-400 mr-2 w-4 h-4" />
                  <input
                    {...register("startTime")}
                    type="time"
                    placeholder="10:00 AM"
                    className="bg-transparent w-full p-2 outline-none text-sm text-gray-100 placeholder:text-gray-500"
                  />
                </div>
                {errors.startTime && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label className="text-sm text-gray-400 block mb-1">
                  End Time{" "}
                  <span className="text-xs text-accent">(11:00:AM)</span>
                </label>
                <div className="flex items-center border-b border-border focus-within:border-accent transition">
                  <Clock className="text-gray-400 mr-2 w-4 h-4" />
                  <input
                    {...register("endTime")}
                    type="time"
                    placeholder="12:30 PM"
                    className="bg-transparent w-full p-2 outline-none text-sm text-gray-100 placeholder:text-gray-500"
                  />
                </div>
                {errors.endTime && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            {/* Session Type */}
            {/* <div>
              <label className="text-sm text-gray-400 block mb-1">
                Session Type
              </label>
              <div className="flex items-center border-b border-border focus-within:border-accent transition">
                <Music className="text-gray-400 mr-2 w-4 h-4" />
                <select
                  {...register("session")}
                  className="bg-transparent w-full p-2 outline-none text-sm text-gray-100"
                >
                  <option className="bg-card text-gray-800" value="">
                    Select Session Type
                  </option>
                  <option className="bg-card text-gray-800" value="recording">
                    Recording
                  </option>
                  <option className="bg-card text-gray-800" value="mixing">
                    Mixing & Mastering
                  </option>
                  <option
                    className="bg-card text-gray-800"
                    value="beat-session"
                  >
                    Beat Session
                  </option>
                  <option
                    className="bg-card text-gray-800"
                    value="full-package"
                  >
                    Full Production Package
                  </option>
                </select>
              </div>
              {errors.session && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.session.message}
                </p>
              )}
            </div> */}

            {/* Notes Input */}
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Notes (Optional)
              </label>
              <textarea
                {...register("notes")}
                placeholder="Any special requests or details for your session?"
                rows={3}
                className="bg-transparent border-b border-border w-full p-2 outline-none text-sm text-gray-100 placeholder:text-gray-500 focus:border-accent transition"
              />
              {errors.notes && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.notes.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-accent text-black font-semibold py-4 rounded-xl hover:opacity-90 transition"
                disabled={loading}
              >
                {loading ? "Booking..." : "Book My Session"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default BookingPage;
