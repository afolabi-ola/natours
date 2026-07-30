import cloudinary from './cloudinary';

const uploadToCloudinary = async (
  buffer: Buffer,
  publicId: string,
): Promise<{ secure_url: string; publicId: string }> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'natours/users',
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        invalidate: true,
      },
      (error, result) => {
        if (error)
          return reject(
            new Error(`Error uploading to Cloudinary: ${error.message}`),
          );

        if (!result)
          return reject(new Error('No result returned from Cloudinary upload'));

        resolve({ secure_url: result.secure_url, publicId: result.public_id });
      },
    );

    stream.end(buffer);
  });

export default uploadToCloudinary;
