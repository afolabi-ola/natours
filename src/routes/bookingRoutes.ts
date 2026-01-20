import { Router } from 'express';
import { protect, restrictTo } from '../controllers/authController';
import {
  getAllBookings,
  getCheckoutSession,
  createBooking,
  getBooking,
  updateBooking,
  deleteBooking,
} from '../controllers/bookingController';

const router = Router();

router.get('/checkout-session/:tourId', protect, getCheckoutSession);

router.use(protect, restrictTo('admin', 'lead-guide'));

router.route('/').get(getAllBookings).post(createBooking);

router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking);

export default router;
