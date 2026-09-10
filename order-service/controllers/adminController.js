import * as adminService from '../services/adminService.js';

export const getAllOrders = async (req, res, next) => {
  try {
    const { restaurantId, status, page, limit, month, year } = req.query;
    const result = await adminService.getAllOrders(restaurantId, status, page, limit, month, year);
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
