import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'd1xj0g7qf',
  api_key: process.env.CLOUDINARY_API_KEY || '<your_api_key>',
  api_secret: process.env.CLOUDINARY_API_SECRET || '<your_api_secret>',
});

export default cloudinary;
