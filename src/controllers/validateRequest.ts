import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import AppError from '../utils/appError';

interface ValidationSchemas {
  body?: Joi.Schema;
  params?: Joi.Schema;
  query?: Joi.Schema;
}

const validateRequest = function (schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (schemas.body) {
      const { error } = schemas.body.validate(req.body, { abortEarly: false });

      if (error) {
        return next(new AppError(error.message, 400));
      }
    }

    if (schemas.params) {
      const { error } = schemas.params.validate(req.params, {
        abortEarly: false,
      });

      if (error) {
        return next(new AppError(error.message, 400));
      }
    }

    if (schemas.query) {
      const { error } = schemas.query.validate(req.query, {
        abortEarly: false,
      });

      if (error) {
        return next(new AppError(error.message, 400));
      }
    }

    next();
  };
};

export default validateRequest;
