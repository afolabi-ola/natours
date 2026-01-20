import { type Response, type Request, NextFunction } from 'express';
import multer, { FileFilterCallback, memoryStorage } from 'multer';
import sharp from 'sharp';
import Tour from '../models/tourModel';
import catchAsync from '../utils/catchAsync';
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from './handlerFactory';
import AppError from '../utils/appError';

const multerStorage = memoryStorage();

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image')) return cb(null, true);
  cb(new AppError('Not an image! Please upload only images', 400));
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 3,
  },
]);

export const resizeTourImages = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.files || Array.isArray(req.files)) return next();

    if (!req.files?.imageCover || !req.files?.images) return next();

    const { imageCover, images } = req.files as {
      imageCover?: Express.Multer.File[];
      images?: Express.Multer.File[];
    };

    if (!imageCover || !images) return next();

    if (imageCover.length === 0 || images.length === 0) return next();

    //1. Image Cover
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    await sharp(imageCover[0]!.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);

    //2. Images
    req.body.images = [];

    await Promise.all(
      images.map(async (image, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

        await sharp(image.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
      }),
    );

    next();
  },
);

export const getAllTours = getAll(Tour, 'tours');
export const getTour = getOne(Tour, 'tour', { path: 'reviews' });
export const createTour = createOne(Tour, 'tour');
export const updateTour = updateOne(Tour, 'tour');
export const deleteTour = deleteOne(Tour, 'tour');

export const getTopFiveAlias = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const aliasQuery =
    'limit=5&sort=-ratingsAverage&fields=name,price,ratingsAverage,summary,difficulty';
  req.url = `${req.path}?${aliasQuery}`;
  next();
};

export const getTourStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },

      {
        $sort: { avgPrice: 1 },
      },

      // {
      //   $match: { _id: { $ne: 'EASY' } },
      // },
    ]);

    res.status(200).json({ status: 'success', data: { stats } });
  },
);

export const getMonthlyPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { year } = req.params;

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },

      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: {
            $month: '$startDates',
          },
          numTourStarts: { $sum: 1 },
          tours: {
            $push: { name: '$name', duration: '$duration' },
          },
        },
      },

      {
        $addFields: {
          month: '$_id',
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: {
          numTourStarts: -1,
        },
      },
      {
        $limit: 12,
      },
    ]);

    res
      .status(200)
      .json({ status: 'success', results: plan.length, data: { plan } });
  },
);

export const getToursWithin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { distance, latlng, unit } = req.params;

    const [lat, lng] = latlng ? latlng.split(',') : [];

    if (!lat || !lng)
      return next(
        new AppError(
          'Please provide latitude and longitude in the format of lat,lng.',
          400,
        ),
      );

    const radius =
      unit === 'mi' ? distance || 0 / 3963.2 : distance || 0 / 6378.1;

    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  },
);

export const getDistance = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { latlng, unit } = req.params;

    const [lat, lng] = latlng ? latlng.split(',') : [];

    if (!lat || !lng)
      return next(
        new AppError(
          'Please provide latitude and longitude in the format of lat,lng.',
          400,
        ),
      );

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(lng) * 1, parseFloat(lat) * 1],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        distances,
      },
    });
  },
);
