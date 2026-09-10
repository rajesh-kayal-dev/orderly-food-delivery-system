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
    const { is_active, is_open, name, address, description, opens_at, closes_at, image_url } = req.body;
    const updatePayload = {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(description !== undefined && { description }),
      ...(image_url !== undefined && { image_url }),
      ...(opens_at !== undefined && { opens_at }),
      ...(closes_at !== undefined && { closes_at }),
      ...(typeof is_active === 'boolean' && { is_active }),
      ...(typeof is_open === 'boolean' && { is_active: is_open })
    };
    const updated = await restaurantService.updateRestaurantProfile(req.user.id, updatePayload);
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
