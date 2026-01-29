import { NextFunction, Request, Response } from 'express';
import Stripe from 'stripe';
import catchAsync from '../utils/catchAsync';
import Tour from '../models/tourModel';
import Booking from '../models/bookingModel';
import AppError from '../utils/appError';
import {
  createOne,
  deleteOne,
  // getAll,
  getOne,
  updateOne,
} from './handlerFactory';
import User from '../models/userModel';

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const getCheckoutSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.tourId || !req.query.startDate) {
      return next(
        new AppError('Tour ID and startDate is required for checkout', 400),
      );
    }

    const tour = await Tour.findById(req.params.tourId);

    if (!tour) return next(new AppError('No tour found with that name', 404));

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      // success_url: `${req.protocol}://${req.get('host')}/?tour=${tour.id}&user=${req.user.id}&price=${tour.price}`,
      success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.user.email!,
      client_reference_id: req.params.tourId!,
      metadata: {
        startDate: req.query.startDate.toString() as string,
      },

      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: tour.price * 100,
            product_data: {
              name: `${tour.name} Tour`,
              description: `${tour.summary}`,
              images: [
                `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
              ],
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

// export const createBookingCheckout = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { tour, user, price } = req.query;

//     if (!tour && !user && !price) return next();

//     await Booking.create({ tour, user, price });

//     res.redirect(req.originalUrl.split('?')[0]!);
//   },
// );

const createBookingCheckout = async (session: Stripe.Checkout.Session) => {
  const tourId = session.client_reference_id;
  const { startDate } = session.metadata || {};

  if (!startDate) {
    console.error('No start date for booking');
    return;
  }

  const updatedTour = await Tour.findOneAndUpdate(
    {
      _id: tourId,
      'startDates.dates': startDate,
      // 'startDates.participants': { $lt: maxGroupSize },
    },
    { $inc: { 'startDates.$.participants': 1 } },
    { new: true },
  );

  // const boughtDate = tour?.startDates.find((d) => d.date === startDate);

  // if (
  //   (boughtDate?.participants || 0) >= (tour?.maxGroupSize || 0) ||
  //   boughtDate?.soldOut
  // )
  //   return;

  // tour?.startDates.find((d) => d.date === startDate)?.participants += 1;

  // await tour.save();

  const userDoc = await User.findOne({ email: session.customer_email });

  if (!userDoc) {
    console.error('No user found with this email');
    return;
  }

  const user = userDoc.id;

  const price = session.amount_total ? session.amount_total : 0;

  if (updatedTour) await Booking.create({ tour: updatedTour._id, user, price });
};

export const webhookCheckout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers ? req.headers['stripe-signature'] : '';

    if (!signature)
      return next(
        new AppError(`Webhook error: Invalid or missing signature`, 400),
      );

    let event: Stripe.Event;
    try {
      event = Stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || '',
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).send(`Webhook error: ${errorMessage}`);
      return;
    }

    if (event.type === 'checkout.session.completed')
      createBookingCheckout(event.data.object as Stripe.Checkout.Session);

    res.status(200).json({ recieved: true });
  },
);

// export const getAllBookings = getAll(Booking, 'bookings');

export const getAllBookings = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let filter = {};

    const { tourId, userId } = req.params;

    if (tourId) filter = { ...filter, tour: tourId };

    if (userId) filter = { ...filter, user: userId };

    const bookings = await Booking.find(filter);

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: {
        bookings,
      },
    });
  },
);

export const getBooking = getOne(Booking, 'booking', { path: 'user' });
export const createBooking = createOne(Booking, 'booking');
export const updateBooking = updateOne(Booking, 'booking');
export const deleteBooking = deleteOne(Booking, 'booking');
