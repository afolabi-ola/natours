import { NextFunction, Request, Response } from 'express';
import Stripe from 'stripe';
import catchAsync from '../utils/catchAsync';
import Tour from '../models/tourModel';
import Booking from '../models/bookingModel';
import AppError from '../utils/appError';
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from './handlerFactory';

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const getCheckoutSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.tourId) {
      return next(new AppError('Tour ID is required for checkout', 400));
    }

    const tour = await Tour.findById(req.params.tourId);

    if (!tour) return next(new AppError('No tour found with that name', 404));

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      success_url: `${req.protocol}://${req.get('host')}/?tour=${tour.id}&user=${req.user.id}&price=${tour.price}`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.user.email!,
      client_reference_id: req.params.tourId!,

      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: tour.price * 100,
            product_data: {
              name: `${tour.name} Tour`,
              description: `${tour.summary}`,
              images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
    });

    res.status(200).json({
      status: 'success',
      session,
    });
  },
);

export const createBookingCheckout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { tour, user, price } = req.query;

    if (!tour && !user && !price) return next();

    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?')[0]!);
  },
);

export const getAllBookings = getAll(Booking, 'bookings');
export const getBooking = getOne(Booking, 'booking', { path: 'user' });
export const createBooking = createOne(Booking, 'booking');
export const updateBooking = updateOne(Booking, 'booking');
export const deleteBooking = deleteOne(Booking, 'booking');
