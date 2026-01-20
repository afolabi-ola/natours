import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import Tour from '../models/tourModel';
import Booking from '../models/bookingModel';
import AppError from '../utils/appError';
import User from '../models/userModel';

export const getOverview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const tours = await Tour.find();

    res.status(200).render('overview', {
      title: 'All Tours',
      tours,
    });
  },
);

export const getTour = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { slug } = req.params;

    const tour = await Tour.findOne({ slug }).populate({
      path: 'reviews',
      select: 'review rating user',
    });

    if (!tour) return next(new AppError('No tour found with that name', 404));

    res.status(200).render('tour', {
      title: `${tour && tour?.name} Tour`,
      tour,
    });
  },
);

export const getLoginForm = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).render('login', {
      title: 'Login to your account',
    });
  },
);

export const getAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).render('account', {
      title: 'Your account',
    });
  },
);

export const getBookings = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const bookings = await Booking.find({ user: req.user.id });

    const tourIds = bookings.map((el) => el.tour);

    const tours = await Tour.find({ _id: { $in: tourIds } });

    res.status(200).render('overview', {
      title: 'My tours',
      tours,
    });
  },
);

export const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: req.body.name,
        email: req.body.email,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).render('account', {
      title: 'Your account',
      user: updatedUser,
    });
  },
);
