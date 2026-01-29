import { model, Query, Schema, Types } from 'mongoose';
import slugify from 'slugify';
// import User, { UserDocType } from './userModel';

interface ITour {
  id: number;
  name: string;
  slug: string;
  duration: number;
  maxGroupSize: number;
  difficulty: 'easy' | 'medium' | 'difficult';
  ratingsAverage: number;
  ratingsQuantity: number;
  price: number;
  priceDiscount: number;
  summary: string;
  description: string;
  imageCover: string;
  images: string[];
  startDates: {
    date: string;
    participants: number;
    soldOut: boolean;
  }[];
  createdAt: Date;
  secretTour: boolean;
  startLocation: {
    type: {
      type: string;
      default: string;
      enum: 'Point';
    };
    coordinates: number[];
    address: string;
    description: string;
  };
  locations: {
    type: {
      type: string;
      default: string;
      enum: 'Point';
    };
    coordinates: number[];
    address: string;
    description: string;
    day: number;
  }[];
  // guides: (UserDocType | null)[];
  guides: Types.ObjectId[];
}

const tourSchema = new Schema<ITour>(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      maxLength: [40, 'A tour name cannot be more than 40 characters long'],
      minLength: [10, 'A tour name cannot be less than 10 characters long'],
      unique: true,
      trim: true,
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: `Difficulty is either 'easy', 'medium', or 'difficult'`,
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings cannot be less than 1.0'],
      max: [5, 'Ratings cannot be more 5.0'],
      set: (val: number) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price must be lower than regular price',
      },
    },
    summary: {
      type: String,
      required: [true, 'A tour must have a summary'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },

    images: [String],
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    startDates: [
      {
        date: String,
        participants: {
          type: Number,
          default: 0,
        },
        soldOut: {
          type: Boolean,
          default: false,
        },
      },
    ],
    secretTour: {
      type: Boolean,
      default: false,
      select: false,
    },

    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: Schema.ObjectId,
        ref: 'User',
      },
    ],
    // reviews
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

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//Document Middleware: Will run on .save, .create
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = (this.guides ?? []).map(
//     async (id) => await User.findById(id),
//   );
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('Will save document:', this);
//   next();
// });

// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

//Query Middleware
// tourSchema.pre('find', function (next) {
tourSchema.pre<Query<ITour[], ITour>>(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  // this.start = Date.now();

  next();
});

tourSchema.pre<Query<ITour[], ITour>>(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -password -passwordChangedAt',
  });

  next();
});

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   next();
// });

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(docs);

//   console.log(`Query took ${Date.now() - this.start} milliseconds`);

//   next();
// });

const Tour = model<ITour>('Tour', tourSchema);

export default Tour;
