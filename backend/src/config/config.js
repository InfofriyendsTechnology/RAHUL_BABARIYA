import dotenv from 'dotenv';
dotenv.config({ quiet: true });

export const PORT = process.env.PORT || 5050;
export const MONGODB_URI = process.env.MONGODB_URI;
export const JWT_SECRET = process.env.JWT_SECRET || 'rahul-babariya-secret';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const inferFrontendURL = () => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:5173';
};
export const FRONTEND_URL = inferFrontendURL();
