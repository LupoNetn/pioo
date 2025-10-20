import { useEffect } from "react";
import useBookingStore from "../stores/useBookingStore";
import useAuthStore from "../stores/useAuthStore";

const ProfilePage = () => {
  const user = useAuthStore((state: any) => state.user);
  const fetchAllBookings = useBookingStore((state: any) => state.fetchAllBookings);
  const bookings = useBookingStore((state: any) => state.Bookings) || [];
  const loading = useBookingStore((state: any) => state.loading);
  const error = useBookingStore((state: any) => state.error);

  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white font-semibold text-lg">
        Loading your bookings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-400 font-medium">
        Failed to load bookings. Please try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white p-6 font-audio">
      <div className="max-w-3xl mx-auto mt-16">
        {/* Welcome Section */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold">
            Welcome,{" "}
            <span className="text-accent italic">{user?.username || "Guest"}</span>
          </h2>
          <p className="text-gray-400 mt-2">
            Here’s a summary of your recent booking activity.
          </p>
        </div>

        {/* Activity Section */}
        <section className="bg-[#1a1a1a] rounded-2xl p-6 shadow-lg border border-accent/10">
          <h3 className="text-xl font-semibold text-accent mb-4">Your Activity</h3>

          {bookings.length === 0 ? (
            <p className="text-gray-400">You have no bookings yet.</p>
          ) : (
            <ul className="space-y-3">
              {bookings.map((booking: any) => (
                <li
                  key={booking.id}
                  className="flex justify-between items-center bg-[#232323] p-4 rounded-xl hover:bg-accent/10 transition-all duration-200"
                >
                  <div>
                    <p className="text-lg font-medium text-white">
                      {booking.title || "Studio Booking"}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {booking.date
                        ? new Date(booking.date).toLocaleDateString()
                        : "No date"}
                    </p>
                  </div>
                  <span className="text-sm text-accent font-semibold">
                    {booking.status || "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
