import prisma from '../config/prisma.js';

class RestaurantService {
    async getAllRestaurants(query = {}) {
        const { search, activeOnly = true } = query;
        const where = {};

        if (activeOnly) {
            where.is_active = true;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } }
            ];
        }

        return await prisma.restaurant.findMany({
            where,
            include: {
                categories: {
                    include: {
                        menuItems: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    async getRestaurantById(id) {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id },
            include: {
                categories: {
                    include: {
                        menuItems: true
                    }
                }
            }
        });

        if (!restaurant) {
            throw new Error('Restaurant not found');
        }

        return restaurant;
    }

    async getRestaurantByUserId(userId) {
        const restaurant = await prisma.restaurant.findUnique({
            where: { user_id: userId },
            include: {
                categories: {
                    include: {
                        menuItems: true
                    }
                }
            }
        });

        if (!restaurant) {
            throw new Error('Restaurant profile not found for this user');
        }

        return restaurant;
    }

    async updateRestaurantProfile(userId, updateData) {
        const restaurant = await prisma.restaurant.findUnique({ where: { user_id: userId } });
        if (!restaurant) {
            throw new Error('Restaurant profile not found');
        }

        return await prisma.restaurant.update({
            where: { id: restaurant.id },
            data: updateData
        });
    }
}

export default new RestaurantService();
