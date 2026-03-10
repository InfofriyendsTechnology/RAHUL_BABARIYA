import jwt from 'jsonwebtoken';
import { JWT_SECRET, ADMIN_PASSWORD } from '../config/config.js';
import responseHandler from '../utils/responseHandler.js';

// POST /api/v1/auth/login
export const adminLogin = (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return responseHandler.error(res, 'Password is required');
    }
    if (password !== ADMIN_PASSWORD) {
      return responseHandler.unauthorized(res, 'Invalid password');
    }
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    return responseHandler.success(res, 'Login successful', { token });
  } catch (error) {
    return responseHandler.serverError(res, error);
  }
};
