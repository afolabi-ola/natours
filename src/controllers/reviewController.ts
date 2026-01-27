import { NextFunction, Request, Response } from 'express';
import Review from '../models/reviewModel';
import AppError from '../utils/appError';
import { getAll, getOne } from './handlerFactory';
import ReviewService from '../services/reviewService';
import catchAsync from '../utils/catchAsync';
import Booking from '../models/bookingModel';

export const setTourUserIds = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.body || Object.keys(req.body).length === 0)
    return next(new AppError('Request body is required', 400));

  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

export const checkIsBooked = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { tour, user } = req.body;

  const booking = await Booking.findOne({ tour, user });

  if (!booking)
    return next(
      new AppError(
        'You are not not allowed to create reviews on a tour you have not booked',
        403,
      ),
    );

  next();
};

export const getAllReviews = getAll(Review, 'reviews');
export const getReview = getOne(Review, 'review');

export const createReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const review = await ReviewService.create({
      review: req.body.review,
      rating: req.body.rating,
      tour: req.body.tour,
      user: req.body.user,
    });

    res.status(201).json({
      status: 'success',
      data: {
        review,
      },
    });
  },
);

export const updateReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const review = await ReviewService.update(req.params.id || '', {
      review: req.body.review,
      rating: req.body.rating,
    });

    res.status(200).json({
      status: 'success',
      data: {
        review,
      },
    });
  },
);

export const deleteReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const review = await ReviewService.delete(req.params.id || '');

    res.status(204).json({
      status: 'success',
      data: {
        review,
      },
    });
  },
);
