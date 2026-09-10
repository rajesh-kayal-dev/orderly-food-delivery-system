import prisma from '../config/prisma.js';

class MenuService {
    async createCategory(userId, categoryData) {
        const restaurant = await prisma.restaurant.findUnique({ where: { user_id: userId } });
        if (!restaurant) throw new Error('Restaurant not found');

        return await prisma.menuCategory.create({
            data: {
                restaurant_id: restaurant.id,
                name: categoryData.name,
                sort_order: categoryData.sort_order || 0
            }
        });
    }

    async createMenuItem(userId, itemData) {
        const restaurant = await prisma.restaurant.findUnique({ where: { user_id: userId } });
        if (!restaurant) throw new Error('Restaurant not found');

        return await prisma.menuItem.create({
            data: {
                restaurant_id: restaurant.id,
                category_id: itemData.category_id,
                name: itemData.name,
                description: itemData.description,
                price: parseFloat(itemData.price),
                image_url: itemData.image_url,
                is_available: itemData.is_available !== undefined ? itemData.is_available : true
            }
        });
    }

    async updateMenuItem(userId, itemId, itemData) {
        const restaurant = await prisma.restaurant.findUnique({ where: { user_id: userId } });
        if (!restaurant) throw new Error('Restaurant not found');

        const menuItem = await prisma.menuItem.findFirst({
            where: { id: itemId, restaurant_id: restaurant.id }
        });
        if (!menuItem) throw new Error('Menu item not found or unauthorized');

        return await prisma.menuItem.update({
            where: { id: itemId },
            data: {
                ...itemData,
                ...(itemData.price !== undefined && { price: parseFloat(itemData.price) })
            }
        });
    }

    async deleteMenuItem(userId, itemId) {
        const restaurant = await prisma.restaurant.findUnique({ where: { user_id: userId } });
        if (!restaurant) throw new Error('Restaurant not found');

        const menuItem = await prisma.menuItem.findFirst({
            where: { id: itemId, restaurant_id: restaurant.id }
        });
        if (!menuItem) throw new Error('Menu item not found or unauthorized');

        await prisma.menuItem.delete({ where: { id: itemId } });
        return { success: true };
    }
}

export default new MenuService();
