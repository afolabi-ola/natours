import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import catchAsync from '../utils/catchAsync';
import User, { UserDocType } from '../models/userModel';
import AppError from '../utils/appError';
import verifyToken from '../utils/verifyToken';
import Email from '../utils/email';

const signToken = (id: Types.ObjectId) =>
  jwt.sign({ id: id.toString() }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRY || '5m',
  });

const createSendToken = (
  user: UserDocType,
  statusCode: number,
  res: Response,
) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() +
        (Number(process?.env.JWT_COOKIE_EXPIRY) || 90) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  if (statusCode === 201) {
    const userSafe = { ...user.toObject(), password: undefined };
    // user.password = undefined;
    res.status(statusCode).json({
      status: 'success',
      token,
      user: userSafe,
    });

    return;
  }

  res.status(statusCode).json({
    status: 'success',
    token,
  });
};

export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, passwordConfirm } = req.body;
    const newUser = await User.create({
      name,
      email,
      password,
      passwordConfirm,
    });

    const url = `${req.protocol}://${req.host}/me`;
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, res);
  },
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new AppError('Please provide email and password', 400));

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.isPassWordCorrect(password, user.password)))
      return next(new AppError('Incorrect email or password', 401));

    createSendToken(user, 200, res);
  },
);

export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.cookie('jwt', '', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
    res.status(200).json({ status: 'success' });
  },
);

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    //Get token , check if it exist
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to get access', 401),
      );
    }

    //Verification token

    const decoded = await verifyToken(token, process.env.JWT_SECRET || '');

    //Check if the user still exists

    const user = await User.findById(decoded.id);

    if (!user)
      return next(
        new AppError('The user belonging to this token does not exist', 404),
      );

    //If user changed password after token issue
    if (user.changedPasswordAt(decoded.iat))
      return next(
        new AppError('User recently changed password please login again', 401),
      );

    req.user = user;
    res.locals.user = user;

    next();
  },
);

export const isLoggedIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    //Get token , check if it exist
    if (req.cookies.jwt) {
      //Verification token

      const decoded = await verifyToken(
        req.cookies.jwt,
        process.env.JWT_SECRET || '',
      );

      //Check if the user still exists

      const user = await User.findById(decoded.id);

      if (!user) return next();

      //If user changed password after token issue
      if (user.changedPasswordAt(decoded.iat)) return next();

      res.locals.user = user;

      return next();
    }

    next();
  },
);

export const restrictTo =
  (...roles: UserDocType['role'][]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You do not have permission to perform this task', 403),
      );

    next();
  };

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) return next(new AppError('No email provided', 400));

    const user = await User.findOne({ email });

    if (!user)
      return next(
        new AppError('There is no user with this email address', 404),
      );

    const resetToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    try {
      await new Email(user, resetUrl).sendPasswordReset();

      res.status(200).json({
        status: 'success',
        message: 'Password reset token sent to email.',
      });
      //eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      next(
        new AppError(
          'There was an error sending the email. Please try again later.',
          500,
        ),
      );
    }
  },
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const reqToken = req.params.token;

    if (!reqToken) return next(new AppError('No token provided.', 400));

    const hashedToken = crypto
      .createHash('sha256')
      .update(reqToken)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return next(new AppError('Invalid or expired token', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  },
);

export const updateMyPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return next(new AppError('Request body is required', 400));
    }

    const { currentPassword, newPassword, passwordConfirm } = req.body;

    if (!currentPassword || !newPassword || !passwordConfirm) {
      return next(
        new AppError(
          'Please provide current password, new password and password confirmation',
          400,
        ),
      );
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return next(
        new AppError('The user belonging to this token does not exist', 404),
      );
    }

    const isCorrectPassword = await user.isPassWordCorrect(
      currentPassword,
      user.password,
    );

    if (!isCorrectPassword)
      return next(new AppError('Your current password is incorrect', 401));

    if (newPassword !== passwordConfirm) {
      return next(new AppError('Passwords do not match', 400));
    }

    user.password = newPassword;
    user.passwordConfirm = passwordConfirm;

    await user.save();

    createSendToken(user, 200, res);
  },
);
