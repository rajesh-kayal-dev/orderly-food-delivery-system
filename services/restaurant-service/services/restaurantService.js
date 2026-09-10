import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAllRestaurants = async (query = {}) => {
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
};

export const getRestaurantById = async (id) => {
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
    throw new AppError('Restaurant not found', 404);
  }

  return restaurant;
};

export const getRestaurantByUserId = async (userId) => {
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
    throw new AppError('Restaurant profile not found for this user', 404);
  }

  return restaurant;
};

export const updateRestaurantProfile = async (userId, updateData) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { user_id: userId } });
  if (!restaurant) {
    throw new AppError('Restaurant profile not found', 404);
  }

  return await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: updateData
  });
};

export const createRestaurantProfile = async (userId, data) => {
  const existing = await prisma.restaurant.findUnique({ where: { user_id: userId } });
  if (existing) {
    throw new AppError('Restaurant profile already exists', 400);
  }

  return await prisma.restaurant.create({
    data: {
      user_id: userId,
      name: data.name || 'New Restaurant',
      address: data.address,
      description: data.description,
      is_active: true
    }
  });
};
