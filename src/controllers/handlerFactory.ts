import { Model } from 'mongoose';
import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';
import ApiFeatures from '../utils/apiFeatures';

export const deleteOne = <T>(QModel: Model<T>, resource: string = 'document') =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const doc = await QModel.findByIdAndDelete(id);

    if (!doc)
      return next(new AppError(`No ${resource} found with that ID`, 404));

    res.status(204).json({ status: 'success', data: null });
  });

export const updateOne = <T>(QModel: Model<T>, resource: string = 'document') =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const {
      params: { id },
      body,
    } = req;

    const doc = await QModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
      rawResult: true,
    });

    if (!doc)
      return next(new AppError(`No ${resource} found with that ID`, 404));

    res.status(200).json({ status: 'success', data: { [resource]: doc } });
  });

export const updateOneSafe = <T>(
  QModel: Model<T>,
  resource: string,
  allowedFields: readonly string[],
) =>
  catchAsync(async (req, res, next) => {
    const filteredBody: Record<string, unknown> = {};

    Object.keys(req.body).forEach((key) => {
      if (!allowedFields.includes(key)) {
        return next(new AppError(`You are not allowed to update ${key}`, 400));
      }
      filteredBody[key] = req.body[key];
    });

    const doc = await QModel.findByIdAndUpdate(req.params.id, filteredBody, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError(`No ${resource} found with that ID`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: { [resource]: doc },
    });
  });

export const createOne = <T>(QModel: Model<T>, resource = 'document') =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await QModel.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        [resource]: doc,
      },
    });
  });

export const getOne = <T>(
  QModel: Model<T>,
  //eslint-disable-next-line default-param-last
  resource = 'document',
  popOptions?: { path: string; select?: string },
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const query = QModel.findById(id);

    if (popOptions) query.populate(popOptions);

    const doc = await query;

    if (!doc)
      return next(new AppError(`No ${resource} found with that ID`, 404));

    res.status(200).json({ status: 'success', data: { [resource]: doc } });
  });

export const getAll = <T>(QModel: Model<T>, resource = 'data') =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    //Execute query
    let filter = {};

    if (req.params.tourId && Object.keys(req.params).length > 0)
      filter = { tour: req.params.tourId };

    const features = new ApiFeatures(QModel.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const docs = await features.query.explain();
    const docs = await features.query;

    //Send response
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: { [resource]: docs },
    });
  });
