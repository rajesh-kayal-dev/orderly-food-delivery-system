import prisma from '../config/prisma.js';

export const getAllOrders = async (restaurantId, statusFilter, page = 1, limit = 20, month, year) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const offset = (pageNum - 1) * limitNum;

  const where = {};
  if (restaurantId) where.restaurant_id = restaurantId;
  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'delivered') {
      where.status = { in: ['delivered', 'completed'] };
    } else {
      where.status = statusFilter;
    }
  }

  if (year) {
    const y = parseInt(year, 10);
    let startDate, endDate;
    if (month && month !== 'all') {
      const m = parseInt(month, 10) - 1;
      startDate = new Date(y, m, 1, 0, 0, 0, 0);
      endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
    } else {
      startDate = new Date(y, 0, 1, 0, 0, 0, 0);
      endDate = new Date(y, 11, 31, 23, 59, 59, 999);
    }
    where.created_at = { gte: startDate, lte: endDate };
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        restaurant: {
          include: { user: { select: { phone_number: true } } }
        },
        customer: {
          include: { user: { select: { full_name: true, phone_number: true } } }
        },
        items: {
          include: { menuItem: { select: { name: true, price: true, image_url: true } } }
        },
        deliveryAddress: true
      },
      skip: offset,
      take: limitNum,
      orderBy: { created_at: 'desc' }
    })
  ]);

  const statusCounts = await prisma.order.groupBy({
    by: ['status'],
    where: restaurantId ? { restaurant_id: restaurantId } : {},
    _count: { status: true }
  });

  const counts = {
    pending: 0,
    accepted: 0,
    preparing: 0,
    picked_up: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0
  };

  statusCounts.forEach((sc) => {
    const cnt = sc._count.status;
    if (sc.status === 'completed') {
      counts.delivered += cnt;
    } else if (Object.prototype.hasOwnProperty.call(counts, sc.status)) {
      counts[sc.status] += cnt;
    }
  });

  return {
    orders,
    counts,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(Math.ceil(total / limitNum), 1)
    }
  };
};
