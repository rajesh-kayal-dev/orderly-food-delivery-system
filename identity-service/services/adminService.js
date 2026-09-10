const prisma = require('../config/prisma');
const authService = require('./authService');

class AdminService {
  mapPendingApprovalItem(user) {
    const isRestaurant = user.role === 'restaurant';
    const profile = isRestaurant ? user.Restaurant : user.DeliveryPartner;
    const displayName = isRestaurant
      ? (user.Restaurant?.name || user.full_name || 'Unnamed Restaurant')
      : (user.full_name || 'Unnamed Driver');

    return {
      id: user.id,
      type: isRestaurant ? 'restaurant' : 'driver',
      name: displayName,
      email: user.email,
      phone: user.phone_number,
      status: 'PENDING',
      created_at: user.created_at,
      avatarUrl: null,
      details: {
        user: {
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number
        },
        driver: !isRestaurant ? {
          id_cccd: null,
          driver_license: user.DeliveryPartner?.vehicle_license || null,
          vehicle_info: user.DeliveryPartner?.vehicle_license || null,
          uploaded_documents: []
        } : null,
        restaurant: isRestaurant ? {
          restaurant_name: user.Restaurant?.name || null,
          owner_name: user.full_name,
          email: user.email,
          phone: user.phone_number,
          address: user.Restaurant?.location || null,
          business_license: null,
          images: [],
          menu: []
        } : null,
        profile
      }
    };
  }

  async getSystemStats() {
    const [userCount, restaurantCount, driverCount, orderAggregate] = await Promise.all([
      prisma.user.count({ where: { is_active: true } }),
      prisma.restaurant.count({
        where: { user: { is_active: true } }
      }),
      prisma.deliveryPartner.count({
        where: { user: { is_active: true } }
      }),
      prisma.order.aggregate({
        _sum: { total_amount: true },
        _count: { id: true },
        where: {
          status: { in: ['delivered', 'completed'] }
        }
      })
    ]);

    return {
      totalUsers: userCount,
      activeRestaurants: restaurantCount,
      deliveryPartners: driverCount,
      totalRevenue: Number(orderAggregate._sum.total_amount) || 0,
      totalOrders: orderAggregate._count.id || 0
    };
  }

  async getAllUsers(status) {
    let where = {};

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
        created_at: true,
        deleted_at: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async updateUserStatus(userId, isActive, currentAdminId) {
    if (typeof isActive !== 'boolean') {
      throw new Error('is_active is required and must be boolean');
    }

    if (isActive) {
      return await authService.activateAccount(userId);
    }

    return await authService.suspendAccount(userId, { currentAdminId });
  }

  async getPendingApprovals({ type = 'all', search = '', sort = 'newest', page = 1, limit = 9 }) {
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 9, 1);

    const where = {
      role: { in: ['restaurant', 'delivery_partner'] },
      is_active: false
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { full_name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        full_name: true,
        phone_number: true,
        role: true,
        created_at: true,
        Restaurant: {
          select: {
            id: true,
            name: true,
            location: true,
            cuisine_type: true,
            opening_hours: true,
            is_open: true,
            rating: true,
            delivery_radius: true
          }
        },
        DeliveryPartner: {
          select: {
            id: true,
            vehicle_license: true,
            is_available: true,
            rating: true
          }
        }
      },
      orderBy: { created_at: sort === 'oldest' ? 'asc' : 'desc' }
    });

    let items = users.map((user) => this.mapPendingApprovalItem(user));

    if (type === 'driver' || type === 'restaurant') {
      items = items.filter((item) => item.type === type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter((item) =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.email?.toLowerCase().includes(searchLower)
      );
    }

    const total = items.length;
    const offset = (parsedPage - 1) * parsedLimit;
    const paginatedItems = items.slice(offset, offset + parsedLimit);

    return {
      items: paginatedItems,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.max(Math.ceil(total / parsedLimit), 1)
      }
    };
  }

  async getPendingApprovalById(userId) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: { in: ['restaurant', 'delivery_partner'] },
        is_active: false
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone_number: true,
        role: true,
        created_at: true,
        Restaurant: {
          select: {
            id: true,
            name: true,
            location: true,
            cuisine_type: true,
            opening_hours: true,
            is_open: true,
            rating: true,
            delivery_radius: true
          }
        },
        DeliveryPartner: {
          select: {
            id: true,
            vehicle_license: true,
            is_available: true,
            rating: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Pending approval request not found');
    }

    return this.mapPendingApprovalItem(user);
  }

  async approvePendingRequest(userId) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: { in: ['restaurant', 'delivery_partner'] }
      }
    });

    if (!user) {
      throw new Error('Approval request not found');
    }

    const updated = await authService.activateAccount(userId);

    try {
      const axios = require('axios');
      await axios.post('http://localhost:5005/api/notifications/mail/send-approval-status', {
        to: user.email,
        fullName: user.full_name,
        accountType: user.role === 'restaurant' ? 'restaurant' : 'delivery_partner',
        status: 'APPROVED'
      });
    } catch (mailError) {
      console.error('Failed to send approval email via Notification Service:', mailError.message);
    }

    return { id: user.id, status: 'APPROVED', state: updated.state };
  }

  async rejectPendingRequest(userId, reason = '') {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: { in: ['restaurant', 'delivery_partner'] }
      },
      include: {
        Restaurant: true,
        DeliveryPartner: true
      }
    });

    if (!user) {
      throw new Error('Approval request not found');
    }

    const email = user.email;
    const fullName = user.full_name;
    const accountType = user.role === 'restaurant' ? 'restaurant' : 'delivery_partner';

    if (user.Restaurant) {
      await prisma.restaurant.delete({ where: { id: user.Restaurant.id } });
    } else if (user.DeliveryPartner) {
      await prisma.deliveryPartner.delete({ where: { id: user.DeliveryPartner.id } });
    }

    await prisma.user.delete({ where: { id: user.id } });

    try {
      const axios = require('axios');
      await axios.post('http://localhost:5005/api/notifications/mail/send-approval-status', {
        to: email,
        fullName,
        accountType,
        status: 'REJECTED',
        reason
      });
    } catch (mailError) {
      console.error('Failed to send rejection email via Notification Service:', mailError.message);
    }

    return { id: user.id, status: 'REJECTED', reason: reason || null };
  }
}

module.exports = new AdminService();
