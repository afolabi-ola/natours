import { Router } from 'express';
import { protect, restrictTo } from '../controllers/authController';
import {
  createReview,
  deleteReview,
  getAllReviews,
  getReview,
  setTourUserIds,
  updateReview,
} from '../controllers/reviewController';
import validateRequest from '../controllers/validateRequest';
import {
  createReviewParamsSchema,
  createReviewBodySchema,
} from '../validators/review.validator';

const router = Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .get(getAllReviews)
  .post(
    restrictTo('user'),
    validateRequest({
      body: createReviewBodySchema,
      params: createReviewParamsSchema,
    }),
    setTourUserIds,
    createReview,
  );

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

export default router;
