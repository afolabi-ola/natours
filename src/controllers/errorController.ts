import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError';

// ----- MongoDB Error Types -----
interface MongooseCastError {
  name: 'CastError';
  path: string;
  value: unknown;
}

interface MongooseDuplicateError {
  code: 11000;
  keyValue: Record<string, unknown>;
}

interface MongooseValidationError {
  name: 'ValidationError';
  errors: Record<string, { message: string }>;
}

interface JsonWebTokenInvalidError {
  name: 'JsonWebTokenError';
}

interface JsonWebTokenExpiredError {
  name: 'TokenExpiredError';
}

// ----- Handlers -----
function handleCastErrorDB(error: MongooseCastError) {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
}

function handleDuplicateFieldsDB(error: MongooseDuplicateError) {
  const duplicateValue = Object.values(error.keyValue)[0];
  const message = `Duplicate field value: ${duplicateValue}. Please use another value.`;
  return new AppError(message, 400);
}

function handleValidationErrorDB(error: MongooseValidationError) {
  const messages = Object.values(error.errors).map((el) => el.message);
  return new AppError(`Invalid input data. ${messages.join('. ')}`, 400);
}

function handleInvalidTokenError() {
  return new AppError(
    'Login session is invalid. Please sign in again to get access.',
    401,
  );
}

function handleExpiredTokenError() {
  return new AppError(
    'Login session is expired. Please sign in again to get access.',
    401,
  );
}

// ----- Development -----
function sendErrDev(err: AppError, req: Request, res: Response) {
  //Api Error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }
  //Render Website error
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });
}

// ----- Production -----
function sendErrProd(err: AppError, req: Request, res: Response) {
  //Api Error
  if (req.originalUrl.startsWith('/api')) {
    //A) isOperational: trusted error send message to the client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or other unknown error dont leak details to client
    // eslint-disable-next-line no-console
    console.error('Error 💥:', err);

    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  //Render Website error
  //A) isOperational: trusted error send message to the client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }

  // B) Programming or other unknown error dont leak details to client
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later',
  });
}

// ----- GLOBAL HANDLER -----
const globalErrorHandler = (
  // err: unknown,
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Convert unknown → AppError (default fallback)
  // let error: AppError =
  //   err instanceof AppError ? err : new AppError('Unknown error', 500);
  let error: AppError = err;

  error.status = error.status || 'error';
  error.statusCode = error.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrDev(error, req, res);
    return;
  }

  // ---- Narrowing MongoDB errors ----
  if ((err as unknown as MongooseCastError).name === 'CastError') {
    error = handleCastErrorDB(err as unknown as MongooseCastError);
  }

  if ((err as unknown as MongooseDuplicateError).code === 11000) {
    error = handleDuplicateFieldsDB(err as unknown as MongooseDuplicateError);
  }

  if ((err as unknown as MongooseValidationError).name === 'ValidationError') {
    error = handleValidationErrorDB(err as unknown as MongooseValidationError);
  }

  if (
    (err as unknown as JsonWebTokenInvalidError).name === 'JsonWebTokenError'
  ) {
    error = handleInvalidTokenError();
  }
  if (
    (err as unknown as JsonWebTokenExpiredError).name === 'TokenExpiredError'
  ) {
    error = handleExpiredTokenError();
  }

  sendErrProd(error, req, res);
};

export default globalErrorHandler;
