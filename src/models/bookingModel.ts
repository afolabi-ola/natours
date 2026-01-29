import { model, Query, Schema, Types } from 'mongoose';

interface BookingDocType {
  user: {
    type: Types.ObjectId;
    ref: string;
  };
  tour: {
    type: Types.ObjectId;
    ref: string;
  };
  price: number;
  createdAt: Date;
  paid: boolean;
  startDate: Date;
}

const bookingSchema = new Schema<BookingDocType>({
  tour: {
    type: Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a tour'],
  },

  user: {
    type: Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a user'],
  },

  price: {
    type: Number,
    required: [true, 'Booking must have a price'],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  paid: {
    type: Boolean,
    default: true,
  },

  startDate: Date,
});

bookingSchema.pre<Query<BookingDocType[], BookingDocType>>(
  /^find/,
  function (next) {
    this.populate('user').populate({
      path: 'tour',
      select: 'name',
    });

    next();
  },
);

const Booking = model<BookingDocType>('Booking', bookingSchema);

export default Booking;
