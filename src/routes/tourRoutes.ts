import { Router } from 'express';
import reviewRouter from './reviewRoutes';
import bookingRouter from './bookingRoutes';
import {
  createTour,
  deleteTour,
  getAllTours,
  getTour,
  updateTour,
  getTopFiveAlias,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistance,
  uploadTourImages,
  resizeTourImages,
} from '../controllers/tourController';
import { protect, restrictTo } from '../controllers/authController';

const router = Router();

router.use('/:tourId/reviews', reviewRouter);
router.use('/:tourId/bookings', bookingRouter);
router.route('/tours-stats').get(getTourStats);
router.route('/top-5-cheap').get(getTopFiveAlias, getAllTours);
router
  .route('/tours-within/distance/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);
router.route('/distance/:latlng/unit/:unit').get(getDistance);

router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);
router
  .route('/')
  .get(
    // validateRequest({ query: getAllToursSchema }),
    getAllTours,
  )
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour,
  )
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

export default router;
