import Joi from 'joi';

export const getReviewSchema = Joi.object({});

export const createReviewBodySchema = Joi.object({
  review: Joi.string().required(),
  rating: Joi.number().min(1).max(5),
  tour: Joi.string(),
  user: Joi.string(),
}).unknown(false);

export const createReviewParamsSchema = Joi.object({
  tourId: Joi.string(),
}).unknown(false);
