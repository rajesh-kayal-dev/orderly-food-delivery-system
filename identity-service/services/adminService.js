import prisma from '../config/prisma.js';
import * as authService from './authService.js';
import { AppError } from '../middleware/errorHandler.js';

export const getSystemStats = async () => {
  const [totalUsers, activeRestaurants, deliveryPartners, orderAggregate] = await Promise.all([
    prisma.user.count(),
    prisma.restaurant.count({ where: { is_active: true } }),
    prisma.deliveryPartner.count({ where: { is_available: true } }),
    prisma.order.aggregate({
      _sum: { total_amount: true },
      _count: { id: true },
      where: { status: 'delivered' }
    })
  ]);

  return {
    totalUsers,
    activeRestaurants,
    deliveryPartners,
    totalRevenue: orderAggregate._sum.total_amount || 0,
    totalOrders: orderAggregate._count.id || 0
  };
};

export const getAllUsers = async (status) => {
  const where = {};
  if (status === 'active') {
    where.is_active = true;
  } else if (status === 'inactive') {
    where.is_active = false;
  }

  return await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      full_name: true,
      phone_number: true,
      role: true,
      is_active: true,
      created_at: true
    },
    orderBy: { created_at: 'desc' }
  });
};

export const updateUserStatus = async (userId, isActive, currentAdminId) => {
  if (typeof isActive !== 'boolean') {
    throw new AppError('is_active is required and must be boolean', 400);
  }

  if (isActive) {
    return await authService.activateAccount(userId);
  }

  return await authService.suspendAccount(userId);
};

const mapPendingApprovalItem = (user) => {
  const isRestaurant = user.role === 'restaurant';
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    phone_number: user.phone_number,
    type: isRestaurant ? 'restaurant' : 'driver',
    created_at: user.created_at,
    restaurant: user.restaurant || null,
    deliveryPartner: user.deliveryPartner || null
  };
};

export const getPendingApprovals = async ({ type = 'all', search = '', sort = 'newest', page = 1, limit = 9 }) => {
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.max(parseInt(limit, 10) || 9, 1);

  const roles = type === 'restaurant' ? ['restaurant'] : type === 'driver' ? ['delivery_partner'] : ['restaurant', 'delivery_partner'];

  const where = {
    role: { in: roles },
    is_active: false
  };

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { full_name: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: {
        restaurant: true,
        deliveryPartner: true
      },
      orderBy: { created_at: sort === 'oldest' ? 'asc' : 'desc' },
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit
    })
  ]);

  return {
    items: users.map(mapPendingApprovalItem),
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.max(Math.ceil(total / parsedLimit), 1)
    }
  };
};

export const getPendingApprovalById = async (userId) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: { in: ['restaurant', 'delivery_partner'] },
      is_active: false
    },
    include: {
      restaurant: true,
      deliveryPartner: true
    }
  });

  if (!user) {
    throw new AppError('Pending approval request not found', 404);
  }

  return mapPendingApprovalItem(user);
};

export const approvePendingRequest = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new AppError('Approval request not found', 404);
  }

  const updated = await authService.activateAccount(userId);

  return { id: user.id, status: 'APPROVED', state: updated.state };
};

export const rejectPendingRequest = async (userId, reason = '') => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new AppError('Approval request not found', 404);
  }

  await prisma.user.delete({
    where: { id: userId }
  });

  return { id: user.id, status: 'REJECTED', reason: reason || null };
};
