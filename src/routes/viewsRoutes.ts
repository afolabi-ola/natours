import { Router } from 'express';
import {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
  getBookings,
  updateUser,
  alerts,
  getSignUpForm,
  getMyReviews,
  getBilling,
} from '../controllers/viewsController';
import { isLoggedIn, protect } from '../controllers/authController';

const router = Router();

router.use(alerts);

// router.use(isLoggedIn);

router.get('/', isLoggedIn, getOverview);
router.get('/search', isLoggedIn, getOverview);

router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/login', isLoggedIn, getLoginForm);
router.get('/signup', isLoggedIn, getSignUpForm);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getBookings);
router.post('/submit-user-data', protect, updateUser);

router.get('/my-reviews', isLoggedIn, getMyReviews);
router.get('/billing', protect, getBilling);

export default router;
