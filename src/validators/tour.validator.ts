import Joi from 'joi';

export const getAllToursSchema = Joi.object({
  fields: Joi.string().pattern(/^[a-zA-Z,]+$/),
  sort: Joi.string().pattern(/^[-a-zA-Z,]+$/),
  page: Joi.number().min(1),
  limit: Joi.number().min(1).max(1000),
  // duration:Joi.number()
}).unknown(false);

export const getTour = Joi.object({});
