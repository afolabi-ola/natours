import { Router } from 'express';
import {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
  getBookings,
  updateUser,
  alerts,
} from '../controllers/viewsController';
import { isLoggedIn, protect } from '../controllers/authController';

const router = Router();

router.use(alerts);

// router.use(isLoggedIn);

router.get('/', isLoggedIn, getOverview);

router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/login', isLoggedIn, getLoginForm);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getBookings);
router.post('/submit-user-data', protect, updateUser);

export default router;
