import prisma from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';

export const getAvailableDeliveries = async () => {
  return await prisma.order.findMany({
    where: {
      status: { in: ['ready', 'preparing'] },
      delivery_partner_id: null
    },
    include: {
      restaurant: { select: { name: true, user_id: true, address: true, image_url: true } },
      deliveryAddress: { select: { address_line1: true, city: true, state: true, postal_code: true } },
      customer: { include: { user: { select: { full_name: true, phone_number: true } } } },
      items: { include: { menuItem: true } }
    },
    orderBy: { updated_at: 'asc' }
  });
};

export const acceptByDriver = async (orderId, userId, io) => {
  const driver = await prisma.deliveryPartner.findUnique({
    where: { user_id: userId },
    include: { user: { select: { full_name: true, phone_number: true } } }
  });

  if (!driver) throw new AppError('Delivery partner profile not found', 404);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, restaurant: true }
  });

  if (!order) throw new AppError('Order not found', 404);
  if (!['ready', 'preparing'].includes(order.status) || order.delivery_partner_id) {
    throw new AppError('Order is no longer available for assignment', 400);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      delivery_partner_id: driver.id,
      status: 'assigned'
    },
    include: {
      deliveryPartner: {
        include: { user: { select: { full_name: true, phone_number: true } } }
      },
      restaurant: true,
      deliveryAddress: true
    }
  });

  const statusData = {
    orderId: order.id,
    status: 'assigned',
    deliveryPartner: updatedOrder.deliveryPartner
  };

  if (io) {
    io.to('available_deliveries').emit('ORDER_ACCEPTED', { orderId: order.id });
    if (order.customer?.user_id) {
      io.to(order.customer.user_id).emit('ORDER_STATUS_UPDATED', statusData);
      io.to(order.customer.user_id).emit('DRIVER_ASSIGNED', statusData);
    }
    if (order.restaurant?.user_id) {
      io.to(order.restaurant.user_id).emit('ORDER_STATUS_UPDATED', statusData);
    }
  }

  return updatedOrder;
};

export const getDriverDeliveries = async (userId) => {
  try {
    const driver = await prisma.deliveryPartner.findUnique({ where: { user_id: userId } });
    if (!driver) return [];

    return await prisma.order.findMany({
      where: {
        delivery_partner_id: driver.id,
        status: { in: ['assigned', 'picked_up'] }
      },
      include: {
        restaurant: { select: { name: true, user_id: true, address: true } },
        deliveryAddress: true,
        customer: { include: { user: { select: { full_name: true, phone_number: true } } } },
        items: { include: { menuItem: true } }
      },
      orderBy: { updated_at: 'desc' }
    });
  } catch (err) {
    console.error('[getDriverDeliveries Error]:', err.message);
    return [];
  }
};

export const getDriverHistory = async (userId) => {
  try {
    const driver = await prisma.deliveryPartner.findUnique({ where: { user_id: userId } });
    if (!driver) return [];

    return await prisma.order.findMany({
      where: {
        delivery_partner_id: driver.id,
        status: { in: ['delivered', 'completed'] }
      },
      include: {
        restaurant: { select: { name: true, user_id: true, address: true } },
        deliveryAddress: true
      },
      orderBy: { updated_at: 'desc' }
    });
  } catch (err) {
    console.error('[getDriverHistory Error]:', err.message);
    return [];
  }
};
