import * as restaurantService from '../services/restaurantService.js';

export const getRestaurants = async (req, res, next) => {
  try {
    const restaurants = await restaurantService.getAllRestaurants(req.query);
    return res.json({ success: true, data: restaurants });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.params.id);
    return res.json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
};

export const getMyRestaurantProfile = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantByUserId(req.user.id);
    return res.json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
};

export const updateMyRestaurantProfile = async (req, res, next) => {
  try {
    const { is_active, name, address, description, opens_at, closes_at } = req.body;
    const updated = await restaurantService.updateRestaurantProfile(req.user.id, {
      ...(name && { name }),
      ...(address && { address }),
      ...(description && { description }),
      ...(opens_at && { opens_at }),
      ...(closes_at && { closes_at }),
      ...(typeof is_active === 'boolean' && { is_active })
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const createRestaurantProfile = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.createRestaurantProfile(req.user.id, req.body);
    return res.status(201).json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
};
