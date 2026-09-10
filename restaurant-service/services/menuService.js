const prisma = require('../config/prisma');

class MenuService {
    async getCategories(restaurantId) {
        return await prisma.menuCategory.findMany({
            where: { restaurant_id: restaurantId }
        });
    }

    async getMenuItems({ restaurantId, categoryId, page = 1, limit = 9, search = '' }) {
        const offset = (page - 1) * limit;
        const where = { restaurant_id: restaurantId };

        if (categoryId) where.category_id = categoryId;
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const [count, rows] = await Promise.all([
            prisma.menuItem.count({ where }),
            prisma.menuItem.findMany({
                where,
                include: { category: { select: { name: true } } },
                take: parseInt(limit),
                skip: parseInt(offset),
                orderBy: { created_at: 'desc' }
            })
        ]);

        return {
            items: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        };
    }

    async createMenuItem(restaurantUserId, itemData) {
        const restaurant = await prisma.restaurant.findUnique({ where: { user_id: restaurantUserId } });
        if (!restaurant) throw new Error('Restaurant profile not found');

        return await prisma.menuItem.create({
            data: {
                ...itemData,
                restaurant_id: restaurant.id
            }
        });
    }

    async updateMenuItem(itemId, restaurantUserId, updateData, io) {
        const restaurant = await prisma.restaurant.findUnique({ where: { user_id: restaurantUserId } });
        const item = await prisma.menuItem.findUnique({ where: { id: itemId } });

        if (!item) throw new Error('Menu item not found');
        if (item.restaurant_id !== restaurant.id) {
            throw new Error('Not authorized to update this item');
        }

        return await prisma.menuItem.update({
            where: { id: itemId },
            data: updateData
        });
    }

    async toggleAvailability(itemId, restaurantUserId, io) {
        const restaurant = await prisma.restaurant.findUnique({ where: { user_id: restaurantUserId } });
        const item = await prisma.menuItem.findUnique({ where: { id: itemId } });

        if (!item) throw new Error('Menu item not found');
        if (item.restaurant_id !== restaurant.id) {
            throw new Error('Not authorized to update this item');
        }

        return await prisma.menuItem.update({
            where: { id: itemId },
            data: { is_available: !item.is_available }
        });
    }

    async deleteMenuItem(itemId, restaurantUserId) {
        const restaurant = await prisma.restaurant.findUnique({ where: { user_id: restaurantUserId } });
        const item = await prisma.menuItem.findUnique({ where: { id: itemId } });

        if (!item) throw new Error('Menu item not found');
        if (item.restaurant_id !== restaurant.id) {
            throw new Error('Not authorized to delete this item');
        }

        await prisma.menuItem.delete({ where: { id: itemId } });
        return { success: true };
    }

    async getFullMenu(restaurantId) {
        return await prisma.menuCategory.findMany({
            where: { restaurant_id: restaurantId },
            include: {
                items: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });
    }

    async getGlobalCategories() {
        const categories = await prisma.menuCategory.findMany({
            select: { name: true },
            distinct: ['name']
        });
        return categories.map(c => c.name);
    }
}

module.exports = new MenuService();
