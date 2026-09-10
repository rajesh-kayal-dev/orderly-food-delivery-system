import * as menuService from '../services/menuService.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await menuService.getCategoriesByRestaurantId(req.params.restaurantId);
    return res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const getMenuItems = async (req, res, next) => {
  try {
    const { restaurantId, categoryId } = req.query;
    const items = await menuService.getMenuItems({ restaurantId, categoryId });
    return res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const getFullMenu = async (req, res, next) => {
  try {
    const categories = await menuService.getCategoriesByRestaurantId(req.params.restaurantId);
    return res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (req, res, next) => {
  try {
    const item = await menuService.createMenuItem(req.user.id, req.body);
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const item = await menuService.updateMenuItem(req.user.id, req.params.id, req.body);
    return res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const toggleAvailability = async (req, res, next) => {
  try {
    const updated = await menuService.toggleItemAvailability(req.params.id);
    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    await menuService.deleteMenuItem(req.user.id, req.params.id);
    return res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    next(error);
  }
};

export const getGlobalCategories = async (req, res, next) => {
  try {
    const categories = await menuService.getGlobalCategories();
    return res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};
