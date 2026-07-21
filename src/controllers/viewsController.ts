import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import Tour from '../models/tourModel';
import Booking from '../models/bookingModel';
import AppError from '../utils/appError';
import User from '../models/userModel';
import Review from '../models/reviewModel';

export const alerts = (req: Request, res: Response, next: NextFunction) => {
  const { alert } = req.query;

  if (alert === 'booking')
    res.locals.alert = `Your booking was successful! Please check your email for confirmation. If your booking doesn't show up here immediately, please come back later.`;

  next();
};

export const getOverview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.query.search) {
      const searchQuery = req.query.search as string;
      const tours = await Tour.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { summary: { $regex: searchQuery, $options: 'i' } },
          { difficulty: { $regex: searchQuery, $options: 'i' } },
        ],
      });

      return res.status(200).render('overview', {
        title: 'Search Results',
        tours,
        isSearch: true,
        searchQuery,
      });
    }

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

    let hasBooked = false;

    if (res.locals.user) {
      const booking = await Booking.findOne({
        tour: tour._id,
        user: res.locals.user.id,
      });

      hasBooked = !!booking;
    }

    res.status(200).render('tour', {
      title: `${tour && tour?.name} Tour`,
      tour,
      hasBooked,
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

export const getSignUpForm = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).render('signUp', {
      title: 'Sign Up for an account',
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
      title: 'My Tours',
      tours,
      isMyBookings: true, // Flag passed to Pug to handle the context custom empty state
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

export const getMyReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const reviews = await Review.find({ user: res.locals.user.id }).populate({
      path: 'tour',
      select: 'name imageCover slug',
    });

    // if (!reviews || reviews.length === 0) {
    //   return next(new AppError('No reviews found for this user.', 404));
    // }

    res.status(200).render('reviews', {
      title: 'My Reviews',
      reviews,
    });
  },
);

export const getBilling = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const bookings = await Booking.find({ user: req.user.id });

    res.status(200).render('billing', {
      title: 'Billing Information',
      bookings,
    });
  },
);
