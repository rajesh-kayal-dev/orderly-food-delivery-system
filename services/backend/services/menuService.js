import { MenuCategory, MenuItem, Restaurant, sequelize } from '../models.js';
import { Op } from 'sequelize';

class MenuService {
    async getCategories(restaurantId) {
        return await MenuCategory.findAll({
            where: { restaurant_id: restaurantId }
        });
    }

    async getMenuItems({ restaurantId, categoryId, page = 1, limit = 50, search = '' }) {
        const offset = (page - 1) * limit;
        const where = {};
        if (restaurantId) where.restaurant_id = restaurantId;
        if (categoryId) where.category_id = categoryId;
        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        const { count, rows } = await MenuItem.findAndCountAll({
            where,
            include: [
                { model: MenuCategory, attributes: ['id', 'name'] },
                { model: Restaurant, attributes: ['id', 'name', 'address', 'image_url', 'cuisine_type'] }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        return {
            items: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        };
    }

    async createMenuItem(restaurantUserId, itemData) {
        const restaurant = await Restaurant.findOne({ where: { user_id: restaurantUserId } });
        if (!restaurant) throw new Error('Restaurant profile not found');

        return await MenuItem.create({
            ...itemData,
            restaurant_id: restaurant.id
        });
    }

    async updateMenuItem(itemId, restaurantUserId, updateData, io) {
        const restaurant = await Restaurant.findOne({ where: { user_id: restaurantUserId } });
        const item = await MenuItem.findByPk(itemId);

        if (!item) throw new Error('Menu item not found');
        if (item.restaurant_id !== restaurant.id) {
            throw new Error('Not authorized to update this item');
        }

        await item.update(updateData);

        // Emit real-time update
        if (io) {
            io.emit('MENU_ITEM_UPDATED', {
                itemId: item.id,
                is_available: item.is_available,
                name: item.name,
                restaurantId: item.restaurant_id,
                price: item.price,
                description: item.description,
                image_url: item.image_url
            });
        }

        return item;
    }

    async toggleAvailability(itemId, restaurantUserId, io) {
        const restaurant = await Restaurant.findOne({ where: { user_id: restaurantUserId } });
        const item = await MenuItem.findByPk(itemId);

        if (!item) throw new Error('Menu item not found');
        if (item.restaurant_id !== restaurant.id) {
            throw new Error('Not authorized to update this item');
        }

        const newStatus = !item.is_available;
        await item.update({ is_available: newStatus });

        // Emit real-time event to all clients
        if (io) {
            io.emit('MENU_ITEM_UPDATED', {
                itemId: item.id,
                is_available: newStatus,
                name: item.name,
                restaurantId: item.restaurant_id,
                price: item.price,
                description: item.description,
                image_url: item.image_url
            });
        }

        return item;
    }

    async deleteMenuItem(itemId, restaurantUserId) {
        const restaurant = await Restaurant.findOne({ where: { user_id: restaurantUserId } });
        const item = await MenuItem.findByPk(itemId);

        if (!item) throw new Error('Menu item not found');
        if (item.restaurant_id !== restaurant.id) {
            throw new Error('Not authorized to delete this item');
        }

        await item.destroy();
        return { success: true };
    }

    async getFullMenu(restaurantId) {
        // Customers also see out-of-order items but they are marked
        const categories = await MenuCategory.findAll({
            where: { restaurant_id: restaurantId },
            include: [{ 
                model: MenuItem, 
                required: false,
                order: [['created_at', 'DESC']]
            }]
        });

        return categories.map((cat) => {
            const plain = cat.get({ plain: true });
            return {
                ...plain,
                items: plain.items || plain.MenuItems || plain.menuItems || []
            };
        });
    }

    async createCategory(userId, data) {
        const restaurant = await Restaurant.findOne({ where: { user_id: userId } });
        if (!restaurant) {
            throw new Error('Restaurant profile not found');
        }
        return await MenuCategory.create({
            restaurant_id: restaurant.id,
            name: data.name
        });
    }

    async getGlobalCategories() {
        const categories = await MenuCategory.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('name')), 'name']]
        });
        return categories.map(c => c.name);
    }
}

export default new MenuService();
