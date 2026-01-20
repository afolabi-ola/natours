import { type Response, type Request, NextFunction } from 'express';
import multer, { FileFilterCallback, memoryStorage } from 'multer';
import sharp from 'sharp';
import catchAsync from '../utils/catchAsync';
import User from '../models/userModel';
import AppError from '../utils/appError';
import {
  deleteOne,
  getAll,
  getOne,
  // updateOne,
  updateOneSafe,
} from './handlerFactory';

// const multerStorage = diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
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

export const uploadUserPhoto = upload.single('photo');

export const resizeUserPhoto = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);

    next();
  },
);

export const getAllUsers = getAll(User, 'users');
export const getUser = getOne(User, 'user');
export const deleteUser = deleteOne(User, 'user');
export const updateUser = updateOneSafe(User, 'user', ['name', 'email']);

const filterObj = <T extends Record<string, unknown>>(
  obj: T,
  ...allowedFields: (keyof T)[]
): Partial<T> => {
  const newObj: Partial<T> = {};

  // Object.keys(obj).forEach((el) => {
  //   if (allowedFields.includes(el)) newObj[el] = obj[el];
  // });

  allowedFields.forEach((field) => {
    if (field in obj) newObj[field] = obj[field];
  });

  return newObj;
};

export const createUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet created. Please use sign up instead',
  });
};

export const getMe = (req: Request, res: Response, next: NextFunction) => {
  req.params.id = req.user.id;
  next();
};

export const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    //1. Check for req body
    if (
      (!req.body && !req.file) ||
      (Object.keys(req.body).length === 0 && req.file === undefined)
    )
      return next(new AppError('Request payload is required', 400));

    //2. Validate body
    if (req.body.password || req.body.passwordConfirm)
      return next(
        new AppError(
          'This route is not for updating password. Please use /updateMyPassword instead',
          400,
        ),
      );

    const filteredBody = filterObj(req.body, 'name', 'email');

    if (req.file) filteredBody.photo = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      status: 'success',
      user: updatedUser,
    });
  },
);

export const deleteMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  },
);
