import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config.js';
import responseHandler from '../utils/responseHandler.js';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return responseHandler.unauthorized(res, 'No token provided');
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return responseHandler.unauthorized(res, 'Invalid or expired token');
  }
};

export default authMiddleware;
