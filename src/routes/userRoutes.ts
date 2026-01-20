import { Router } from 'express';
import {
  createUser,
  deleteMe,
  deleteUser,
  getAllUsers,
  getUser,
  updateMe,
  updateUser,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} from '../controllers/userController';
import {
  protect,
  forgotPassword,
  login,
  resetPassword,
  signup,
  updateMyPassword,
  restrictTo,
  logout,
} from '../controllers/authController';
import validateRequest from '../controllers/validateRequest';
import { loginSchema } from '../validators/auth.validator';

const router = Router();

router.post('/signup', signup);
router.post('/login', validateRequest({ body: loginSchema }), login);
router.get('/logout', logout);
router.post('/forgetPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.use(protect);

router.get('/me', getMe, getUser);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);
router.patch('/updateMyPassword', updateMyPassword);

router.use(restrictTo('admin'));
router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export default router;
