import User from '../../src/models/userModel';
import Tour from '../../src/models/tourModel';
import fs from 'fs';
import { connect } from 'mongoose';
import { config } from 'dotenv';
import Review from '../../src/models/reviewModel';

config();

const DB =
  process.env.NODE_ENV === 'production'
    ? process.env.DATABASE?.replace(
        '<PASSWORD>',
        process.env.DATABASE_PASSWORD ?? '',
      )
    : process.env.DATABASE_LOCAL;

async function connectDb() {
  try {
    if (DB) {
      await connect(DB);
      console.log('DB connection successful!');
    }
  } catch (err) {
    console.log('DB Error:', err);
    process.exit(1);
  }
}

const reviewsData = JSON.parse(
  fs.readFileSync(`${__dirname}/demoUserReviews.json`, 'utf-8'),
);

async function initReviews() {
  try {
    await connectDb();

    const demoUser = await User.findOne({
      isDemoUser: true,
    });

    if (!demoUser)
      throw new Error('Demo user not found. Please create a demo user first.');

    await Promise.all(
      reviewsData.map((review) => updateReview(review, demoUser._id)),
    );
    console.log('Finished restoring demo reviews.');

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
initReviews();

async function updateReview(review, user) {
  try {
    const tour = await Tour.findOne({
      slug: review.tour,
    });

    if (!tour) {
      throw new Error(`Tour "${review.tour}" not found.`);
    }

    const newReview = await Review.findOneAndUpdate(
      {
        tour: tour._id,
        user,
      },
      {
        review: review.review,
        rating: review.rating,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    console.log(`Synced review for ${review.tour}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
