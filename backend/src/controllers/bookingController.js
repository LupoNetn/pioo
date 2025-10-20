import prisma from '../config/db.js';
import { BookingStatus } from '@prisma/client';

// ✅ Make a booking
export const makeBooking = async (req, res) => {
  try {
    const { date, startTime, endTime, notes } = req.body;
    const userId = req.user.id;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date, start time, and end time.',
      });
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        notes,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      booking,
    });
  } catch (error) {
    console.error('Error making booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating booking.',
    });
  }
};

// ✅ Approve a booking (for producer/admin)
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
      message: 'Successfully confirmed booking.',
      booking: approvedBooking,
    });
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while approving booking.',
    });
  }
};

// ✅ Delete a booking
export const deleteBooking = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Allow only the booking owner or admin to delete
    if (booking.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this booking.',
      });
    }

    await prisma.booking.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting booking.',
    });
  }
};

// ✅ Get all bookings made by the logged-in user
export const getUserBookings = async (req, res) => {
  const userId = req.user.id

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching bookings.',
    });
  }
};

// ✅ Get all bookings (for producer/admin dashboard)
export const getAllBookings = async (req, res) => {
  try {
    // Only allow admin/producer to fetch all bookings
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Only producers/admins can view all bookings.',
      });
    }

    const bookings = await prisma.booking.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching all bookings.',
    });
  }
};
