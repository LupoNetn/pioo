import useAuthStore from "../../stores/useAuthStore";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import Spinner from "../../components/Spinner";
import useBookingStore from "../../stores/useBookingStore";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { isAfter, differenceInDays } from "date-fns";

const UserDashboard = () => {
  const user = useAuthStore((state: any) => state.user);
  const id = user?.id;
  const fetchMyBookings = useBookingStore(
    (state: any) => state.fetchMyBookings
  );
  const loading = useBookingStore((state: any) => state.loading);
  const setRescheduleBookingId = useBookingStore(
    (state: any) => state.setRescheduleBookingId
  );

  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  // const [confirmCancel, setConfirmCancel] = useState(false);
  // const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
  //   null
  // );
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        const data = await fetchMyBookings(id);
        setBookings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setBookings([]);
      }
    };
    fetchBooking();
  }, [id]);

  const formatBookingDateTime = (dateInput: string, timeInput: string) => {
    try {
      const date = new Date(dateInput);
      const time = new Date(timeInput);

      if (isNaN(date.getTime()) || isNaN(time.getTime())) return "Invalid date";

      const combined = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes()
      );

      return combined.toLocaleString("en-NG", {
        timeZone: "Africa/Lagos",
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "Invalid date";
    }
  };

  const filteredBookings = bookings
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((booking) =>
      filter === "All"
        ? true
        : booking.status?.toLowerCase() === filter.toLowerCase()
    );

  const totalBookings = bookings.length;
  const recentBookings = bookings.filter((booking) => {
    const date = new Date(booking.date);
    const local = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return differenceInDays(new Date(), local) <= 7;
  }).length;

  const upcomingBookings = bookings.filter((booking) => {
    const date = new Date(booking.date);
    const local = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return isAfter(local, new Date());
  }).length;

  const pendingBookings = bookings.filter(
    (booking) => booking.status?.toLowerCase() === "pending"
  ).length;

  // const handleCancelConfirmation = (id: string) => {
  //   setSelectedBookingId(id);
  //   setConfirmCancel(true);
  // };

  const handleReschedule = (id: string) => {
    setRescheduleBookingId(id);
    navigate("/booking");
  };

  if (loading) {
    return (
      <>
        {" "}
        <Spinner />{" "}
        <p className="text-sm text-accent font-body mt-8">Loading your data</p>
      </>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-30 space-y-8 font-heading">
      {" "}
      <div>
        {" "}
        <h2 className="text-3xl md:text-4xl font-bold">
          Welcome,{" "}
          <span className="text-accent italic">
            {user?.username || "Guest"}
          </span>{" "}
        </h2>{" "}
        <p className="text-gray-400 mt-2 text-sm md:text-base">
          Here’s a summary of your recent booking activity.{" "}
        </p>{" "}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Total", value: totalBookings },
          { title: "Recent (7 days)", value: recentBookings },
          { title: "Upcoming", value: upcomingBookings },
          { title: "Pending", value: pendingBookings },
        ].map((card) => (
          <div
            key={card.title}
            className="bg-[#1a1a1a] p-5 rounded-2xl border border-accent/10 shadow-md hover:border-accent/30 transition-all duration-200"
          >
            <h3 className="text-gray-400 text-sm md:text-base">{card.title}</h3>
            <p className="text-2xl md:text-3xl font-bold text-accent mt-1">
              {card.value}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-between items-center mt-8 gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-accent">
            Bookings Overview
          </h3>
          <button
            onClick={() => navigate("/booking")}
            className="flex items-center justify-center bg-accent/20 hover:bg-accent/40 text-accent p-2 rounded-full transition-all duration-200"
            title="Make a new booking"
          >
            <Plus size={20} />
          </button>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[#1a1a1a] text-white border border-accent/20 px-4 py-2 rounded-lg focus:outline-none focus:border-accent/50 transition"
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
      {filteredBookings.length === 0 ? (
        <p className="text-gray-400 text-center mt-8">
          No bookings found for this category.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredBookings.map((booking: any) => (
            <Card
              key={booking.id}
              className="bg-[#1a1a1a] rounded-2xl p-5 shadow-lg border border-accent/10 hover:border-accent/40 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">
                    Studio Session
                  </h4>
                  <p className="text-gray-400 text-sm mb-3">
                    {booking.date && booking.startTime
                      ? `${formatBookingDateTime(booking.date, booking.startTime)} - ${formatBookingDateTime(
                          booking.date,
                          booking.endTime
                        )}`
                      : "No date provided"}
                  </p>
                </div>
                <div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      booking.status?.toLowerCase() === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : booking.status?.toLowerCase() === "confirmed"
                          ? "bg-green-500/20 text-green-400"
                          : booking.status?.toLowerCase() === "cancelled"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-accent/20 text-accent"
                    }`}
                  >
                    {booking.status || "Pending"}
                  </span>
                </div>
              </div>

              <div className="flex justify-center items-center mt-4 gap-2">
                <Button
                  onClick={() => handleReschedule(booking.id)}
                  className="w-37 bg-yellow-500 rounded-lg hover:bg-yellow-600"
                >
                  Reschedule Booking
                </Button>
                <Button
                  onClick={() => (booking.id)}
                  className="w-37 bg-red-500 rounded-lg hover:bg-red-600"
                >
                  Cancel Booking
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* {confirmCancel && (
        <CancelBooking cancel={confirmCancel} id={selectedBookingId} />
      )} */}
    </div>
  );
};

export default UserDashboard;
