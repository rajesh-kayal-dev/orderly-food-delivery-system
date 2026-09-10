const prisma = require('../config/prisma');

class RestaurantService {
    async getAllRestaurants(query) {
        const { search, category } = query;
        const where = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { cuisine_type: { contains: search, mode: 'insensitive' } }
            ];
        }

        return await prisma.restaurant.findMany({
            where,
            include: {
                MenuCategories: {
                    include: {
                        items: true
                    }
                }
            }
        });
    }

    async getRestaurantById(id, options = {}) {
        const { allowClosed = false } = options;
        const restaurant = await prisma.restaurant.findUnique({
            where: { id }
        });
        if (!restaurant) {
            throw new Error('Restaurant not found');
        }

        if (!allowClosed && !restaurant.is_open) {
            const error = new Error('Restaurant is currently closed');
            error.type = 'RESTAURANT_CLOSED';
            throw error;
        }

        return restaurant;
    }

    async getRestaurantByUserId(userId) {
        const restaurant = await prisma.restaurant.findUnique({ where: { user_id: userId } });
        if (!restaurant) {
            throw new Error('Restaurant profile not found');
        }
        return restaurant;
    }

    async createRestaurant(restaurantData) {
        return await prisma.restaurant.create({
            data: restaurantData
        });
    }
}

module.exports = new RestaurantService();
