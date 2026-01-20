import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

export const { NODE_ENV, PORT, USERNAME, PASSWORD } = process.env;
