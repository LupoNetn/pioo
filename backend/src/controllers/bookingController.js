import prisma from "../config/db.js";
import { BookingStatus } from "@prisma/client";
import { DateTime } from "luxon"; 

//  Make a booking
export const makeBooking = async (req, res) => {
  const { date, startTime, endTime, notes } = req.body;
  const userId = req.user.id;

  if (!date || !startTime || !endTime) {
    return res.status(400).json({
     message: 'All input fields are required!'
    })
  }

 try {
  // 1. Prepare for overlap check using UTC moments
  // We create full ISO strings interpreted as UTC to ensure consistency in the database
  // date should be a date string (e.g., "2025-10-28"), time should be a time string (e.g., "10:00")
  const startISO = `${date}T${startTime}:00.000Z`;
  const endISO = `${date}T${endTime}:00.000Z`;

  const startMoment = new Date(startISO); // e.g., 10:00 AM UTC on the booking date
  const endMoment = new Date(endISO);     // e.g., 11:00 AM UTC on the booking date
  
  // For the date field, we still store a DateTime, but we can ensure it's a clean date (midnight UTC)
  const bookingDate = new Date(date);
  bookingDate.setUTCHours(0, 0, 0, 0);

  // 2. Check for overlapping bookings
  // NOTE: For the overlap check, we rely on the existing database records which were stored as UTC DateTimes.
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      date: bookingDate,
    },
  });
  
  const hasOverlap = overlappingBookings.some((booking) => {
    // If the database still has full DateTime objects for startTime/endTime:
    const existingStart = new Date(booking.startTime);
    const existingEnd = new Date(booking.endTime);
    // If you changed the schema to string, you'd need to reconstruct the Date here:
    // const existingStart = new Date(`${date}T${booking.startTime}:00.000Z`);
    // const existingEnd = new Date(`${date}T${booking.endTime}:00.000Z`);
    
    // Overlap logic using the UTC moments:
    return startMoment < existingEnd && endMoment > existingStart;
  });

  if (hasOverlap) {
    return res.status(409).json({
      success: false,
      message: 'This time slot is already booked. Please choose a different time.'
    });
  }
  
  // 3. Create the booking
  const newBooking = await prisma.booking.create({
    data: {
      userId,
      date: bookingDate,
      startTime: startTime, // Storing as string "10:00"
      endTime: endTime,   // Storing as string "11:00"
      notes,
      status: BookingStatus.PENDING,
    },
  });
  res.status(201).json({
    success: true,
    message: 'Booking created successfully.',
    booking: newBooking,
  });
 } catch (error) {
  res.status(500).json({
    success: false,
    message: 'Internal server error while creating booking.'
  });
 }
};



//reschedule or update a booking
export const rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime, notes } = req.body;
    const userId = req.user.id;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Please provide date, start time, and end time.",
      });
    }

    const bookingDate = new Date(date);
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Step 1: Verify booking exists & belongs to user (or admin)
    const existingBooking = await prisma.booking.findUnique({ where: { id } });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (existingBooking.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to modify this booking.",
      });
    }

    // Step 2: Query bookings for the same date excluding current one
    const sameDayBookings = await prisma.booking.findMany({
      where: {
        date: bookingDate,
        id: { not: id },
        status: { notIn: ["CANCELLED", "COMPLETED"] },
      },
    });

    // Step 3: Check overlap
    const hasOverlap = sameDayBookings.some((b) => {
      const existingStart = new Date(b.startTime);
      const existingEnd = new Date(b.endTime);
      return start < existingEnd && end > existingStart;
    });

    if (hasOverlap) {
      return res.status(409).json({
        success: false,
        message:
          "This time slot overlaps with another booking. Please select a different time.",
      });
    }

    // Step 4: Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        date: bookingDate,
        startTime: start,
        endTime: end,
        notes,
        status: BookingStatus.RESCHEDULED,
      },
    });

    res.status(200).json({
      success: true,
      message: "Booking rescheduled successfully.",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating booking.",
    });
  }
};

//get occupied slots for a given date
export const getOccupiedSlots = async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: "Please provide a date.",
    });
  }

  try {
    const bookingDate = new Date(date);
    const bookings = await prisma.booking.findMany({
      where: {
        date: bookingDate,
        status: { notIn: ["CANCELLED", "COMPLETED"] },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    res.status(200).json({
      success: true,
      occupiedSlots: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching occupied slots.",
    });
  }
};

//get a single booking by id
export const getBookingById = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }
    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching booking.",
    });
  }
};

//  Approve a booking (for producer/admin)
export const approveBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const approvedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CONFIRMED,
      },
    });

    res.status(200).json({
      success: true,
      message: "Successfully confirmed booking.",
      booking: approvedBooking,
    });
  } catch (error) {
    console.error("Error approving booking:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while approving booking.",
    });
  }
};

//  Delete a booking
export const deleteBooking = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    // Allow only the booking owner or admin to delete
    if (booking.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this booking.",
      });
    }

    await prisma.booking.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting booking.",
    });
  }
};

//  Get all bookings made by the logged-in user
export const getUserBookings = async (req, res) => {
  const userId = req.params.id;

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    console.log("User bookings fetched:", bookings);

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching bookings.",
    });
  }
};

//  Get all bookings (for producer/admin dashboard)
export const getAllBookings = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Only producers/admins can view all bookings.",
      });
    }

    // 🧠 Update old bookings to COMPLETED if their date is in the past
    await prisma.booking.updateMany({
      where: {
        date: { lt: new Date() },
        status: { not: BookingStatus.COMPLETED },
      },
      data: { status: BookingStatus.COMPLETED },
    });

    // 🗂 Fetch all bookings (with user info)
    const bookings = await prisma.booking.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching all bookings.",
    });
  }
};
