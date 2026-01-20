import { model, Schema, Types, Query, Model } from 'mongoose';
import Tour from './tourModel';

interface ReviewDocType {
  review: string;
  createdAt: Date;
  rating: number;
  tour: Types.ObjectId;
  user: Types.ObjectId;
}

interface ReviewModel extends Model<ReviewDocType> {
  calcAverageRatings: (tourId: Types.ObjectId) => void;
}

const reviewSchema = new Schema<ReviewDocType>(
  {
    review: { type: String, required: [true, 'Review cannot be empty'] },

    rating: {
      type: Number,
      default: 1.0,
      min: [1, 'Rating cannot be less than 1'],
      max: [5, 'Rating cannot be more than 5'],
    },

    createdAt: { type: Date, default: Date.now },

    tour: {
      type: Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },

    user: {
      type: Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre<Query<ReviewDocType[], ReviewDocType>>(
  /^find/,
  function (next) {
    this.populate({
      path: 'user',
      select: 'name photo',
    });
    // .populate({
    // path: 'tour',
    // select: 'name',
    // })

    next();
  },
);

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

// reviewSchema.post('save', function () {
//   this.constructor.calcAverageRatings(this.tour);
// });

// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   this.r = await this.findOne();
//   next();
// });

// reviewSchema.post(/^findOneAnd/, async function () {
//   await this.r.constructor.calcAverageRatings(this.r.tour);
// });

const Review = model<ReviewDocType, ReviewModel>('Review', reviewSchema);

export default Review;
