import menuService from '../services/menuService.js';
import prisma from '../config/prisma.js';

export const getCategories = async (req, res) => {
    try {
        const categories = await prisma.menuCategory.findMany({
            where: { restaurant_id: req.params.restaurantId },
            include: { menuItems: true }
        });
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getMenuItems = async (req, res) => {
    try {
        const { restaurantId, categoryId } = req.query;
        const where = {};
        if (restaurantId) where.restaurant_id = restaurantId;
        if (categoryId) where.category_id = categoryId;

        const items = await prisma.menuItem.findMany({
            where,
            include: { category: true }
        });
        res.json({ success: true, data: items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getFullMenu = async (req, res) => {
    try {
        const categories = await prisma.menuCategory.findMany({
            where: { restaurant_id: req.params.restaurantId },
            include: { menuItems: true }
        });
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const createMenuItem = async (req, res) => {
    try {
        const item = await menuService.createMenuItem(req.user.id, req.body);
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateMenuItem = async (req, res) => {
    try {
        const item = await menuService.updateMenuItem(req.user.id, req.params.id, req.body);
        res.json({ success: true, data: item });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const toggleAvailability = async (req, res) => {
    try {
        const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } });
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        const updated = await prisma.menuItem.update({
            where: { id: req.params.id },
            data: { is_available: !item.is_available }
        });
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteMenuItem = async (req, res) => {
    try {
        await menuService.deleteMenuItem(req.user.id, req.params.id);
        res.json({ success: true, message: 'Item deleted' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getGlobalCategories = async (req, res) => {
    try {
        const categories = await prisma.menuCategory.findMany({
            select: { name: true },
            distinct: ['name']
        });
        res.json({ success: true, data: categories.map(c => c.name) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
