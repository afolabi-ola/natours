import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { connect } from 'mongoose';
import Tour from '../../src/models/tourModel';
import User from '../../src/models/userModel';
import Review from '../../src/models/reviewModel';

config({
  path: './.env',
});

const DB =
  process.env.NODE_ENV === 'production'
    ? process.env.DATABASE?.replace(
        '<PASSWORD>',
        process.env.DATABASE_PASSWORD ?? '',
      )
    : process.env.DATABASE_LOCAL;

if (DB) {
  connect(DB)
    .then(() => console.log('DB connection successful!'))
    .catch((err) => console.log('DB Error:', err));
}

const tours = JSON.parse(readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

const importData = async function () {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log(`Tour Data imported successfully Total:${tours.length}`);
    console.log(`User Data imported successfully Total:${users.length}`);
    console.log(`Review Data imported successfully Total:${reviews.length}`);
  } catch (error) {
    console.log('Import Error', error);
  }
  process.exit();
};

const deleteData = async function () {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Tours deleted successfully');
    console.log('Users deleted successfully');
    console.log('Reviews deleted successfully');
  } catch (error) {
    console.log('Delete db error:', error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
} else {
  console.log('No action specified. Specify between --import or --delete');
}
