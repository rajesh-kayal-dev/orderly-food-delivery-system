import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const getCategoriesByRestaurantId = async (restaurantId) => {
  return await prisma.menuCategory.findMany({
    where: { restaurant_id: restaurantId },
    include: { menuItems: true },
    orderBy: { sort_order: 'asc' }
  });
};

export const getMenuItems = async ({ restaurantId, categoryId } = {}) => {
  const where = {};
  if (restaurantId) where.restaurant_id = restaurantId;
  if (categoryId) where.category_id = categoryId;

  return await prisma.menuItem.findMany({
    where,
    include: { category: true },
    orderBy: { created_at: 'asc' }
  });
};

export const createCategory = async (userId, categoryData) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { user_id: userId } });
  if (!restaurant) {
    throw new AppError('Restaurant not found', 404);
  }

  return await prisma.menuCategory.create({
    data: {
      restaurant_id: restaurant.id,
      name: categoryData.name,
      sort_order: categoryData.sort_order || 0
    }
  });
};

export const createMenuItem = async (userId, itemData) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { user_id: userId } });
  if (!restaurant) {
    throw new AppError('Restaurant not found', 404);
  }

  return await prisma.menuItem.create({
    data: {
      restaurant_id: restaurant.id,
      category_id: itemData.category_id || null,
      name: itemData.name,
      description: itemData.description,
      price: parseFloat(itemData.price),
      image_url: itemData.image_url,
      is_available: itemData.is_available !== undefined ? itemData.is_available : true
    }
  });
};

export const updateMenuItem = async (userId, itemId, itemData) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { user_id: userId } });
  if (!restaurant) {
    throw new AppError('Restaurant not found', 404);
  }

  const menuItem = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurant_id: restaurant.id }
  });
  if (!menuItem) {
    throw new AppError('Menu item not found or unauthorized', 404);
  }

  return await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      ...itemData,
      ...(itemData.price !== undefined && { price: parseFloat(itemData.price) })
    }
  });
};

export const toggleItemAvailability = async (itemId) => {
  const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
  if (!item) {
    throw new AppError('Item not found', 404);
  }

  return await prisma.menuItem.update({
    where: { id: itemId },
    data: { is_available: !item.is_available }
  });
};

export const deleteMenuItem = async (userId, itemId) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { user_id: userId } });
  if (!restaurant) {
    throw new AppError('Restaurant not found', 404);
  }

  const menuItem = await prisma.menuItem.findFirst({
    where: { id: itemId, restaurant_id: restaurant.id }
  });
  if (!menuItem) {
    throw new AppError('Menu item not found or unauthorized', 404);
  }

  await prisma.menuItem.delete({ where: { id: itemId } });
  return { success: true };
};

export const getGlobalCategories = async () => {
  const categories = await prisma.menuCategory.findMany({
    select: { name: true },
    distinct: ['name']
  });
  return categories.map((c) => c.name);
};
