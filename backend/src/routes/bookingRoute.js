import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  makeBooking,
  approveBooking,
  deleteBooking,
  getUserBookings,
  getAllBookings,
} from '../controllers/bookingController.js';

const router = Router();

// Make a new booking (user)
router.post('/', authMiddleware, makeBooking);

// Approve a booking (producer/admin)
router.patch('/:id/approve', authMiddleware, approveBooking);

// Delete a booking (user or admin)
router.delete('/:id', authMiddleware, deleteBooking);

// Fetch all bookings made by the currently logged-in user
router.get('/my-bookings', authMiddleware, getUserBookings);

// Fetch all bookings (for the producer/admin dashboard)
router.get('/', authMiddleware, getAllBookings);

export default router;
