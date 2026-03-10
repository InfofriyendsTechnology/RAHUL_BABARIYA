import Portfolio from '../models/Portfolio.js';
import { uploadToCloudinary } from '../middleware/upload.js';
import responseHandler from '../utils/responseHandler.js';
import { DEFAULT_PORTFOLIO } from '../utils/defaultData.js';

// GET /api/v1/portfolio
export const getPortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne();
    if (!portfolio) {
      portfolio = await Portfolio.create(DEFAULT_PORTFOLIO);
    }
    return responseHandler.success(res, 'Portfolio fetched', portfolio);
  } catch (error) {
    return responseHandler.serverError(res, error);
  }
};

// PUT /api/v1/portfolio  (auth required)
export const updatePortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne();
    if (!portfolio) {
      portfolio = await Portfolio.create({ ...DEFAULT_PORTFOLIO, ...req.body });
    } else {
      Object.assign(portfolio, req.body);
      await portfolio.save();
    }
    return responseHandler.success(res, 'Portfolio updated', portfolio);
  } catch (error) {
    return responseHandler.serverError(res, error);
  }
};

// POST /api/v1/portfolio/upload-image  (auth required)
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return responseHandler.error(res, 'No image file provided');
    }
    const folder = req.body.folder || 'rahul-babariya';
    const result = await uploadToCloudinary(req.file.buffer, folder);
    return responseHandler.success(res, 'Image uploaded', {
      url:       result.secure_url,
      public_id: result.public_id,
      width:     result.width,
      height:    result.height,
    });
  } catch (error) {
    return responseHandler.serverError(res, error);
  }
};
