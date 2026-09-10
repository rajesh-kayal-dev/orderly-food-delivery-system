import restaurantService from '../services/restaurantService.js';
import prisma from '../config/prisma.js';

export const getRestaurants = async (req, res) => {
    try {
        const restaurants = await restaurantService.getAllRestaurants(req.query);
        res.json({ success: true, data: restaurants });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getRestaurantById = async (req, res) => {
    try {
        const restaurant = await restaurantService.getRestaurantById(req.params.id);
        res.json({ success: true, data: restaurant });
    } catch (error) {
        console.error(error);
        const statusCode =
            error.message === 'Restaurant not found' ? 404 :
            error.type === 'RESTAURANT_CLOSED' ? 403 :
            500;
        res.status(statusCode).json({ success: false, message: error.message, type: error.type });
    }
};

export const getMyRestaurantProfile = async (req, res) => {
    try {
        const restaurant = await restaurantService.getRestaurantByUserId(req.user.id);
        res.json({ success: true, data: restaurant });
    } catch (error) {
        console.error(error);
        res.status(404).json({ success: false, message: error.message });
    }
};

export const updateMyRestaurantProfile = async (req, res) => {
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
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const createRestaurantProfile = async (req, res) => {
    try {
        const { name, address, description } = req.body;
        
        const existing = await prisma.restaurant.findUnique({ where: { user_id: req.user.id } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Restaurant profile already exists' });
        }

        const restaurant = await prisma.restaurant.create({
            data: {
                user_id: req.user.id,
                name: name || 'New Restaurant',
                address,
                description,
                is_active: true
            }
        });

        res.status(201).json({ success: true, data: restaurant });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
};
