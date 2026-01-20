import { Types } from 'mongoose';
import Review from '../models/reviewModel';

export default class ReviewService {
  static async create(data: {
    review: string;
    rating: number;
    tour: Types.ObjectId;
    user: Types.ObjectId;
  }): Promise<unknown> {
    const review = await Review.create(data);

    await Review.calcAverageRatings(review.tour);

    return review;
  }

  static async update(
    id: string,
    data: Partial<{ review: string; rating: number }>,
  ): Promise<unknown> {
    const review = await Review.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!review) return null;

    await Review.calcAverageRatings(review.tour);

    return review;
  }

  static async delete(id: string): Promise<unknown> {
    const review = await Review.findByIdAndDelete(id);

    if (!review) return null;

    await Review.calcAverageRatings(review.tour);

    return review;
  }
}
