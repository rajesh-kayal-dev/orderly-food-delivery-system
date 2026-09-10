import prisma from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';

export const getAvailableDeliveries = async () => {
  return await prisma.order.findMany({
    where: {
      status: 'preparing',
      delivery_partner_id: null
    },
    include: {
      restaurant: { select: { name: true, user_id: true, address: true } },
      deliveryAddress: { select: { address_line1: true, city: true } },
      customer: { include: { user: { select: { full_name: true, phone_number: true } } } }
    },
    orderBy: { updated_at: 'asc' }
  });
};

export const acceptByDriver = async (orderId, driverId, io) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, restaurant: true }
  });

  if (!order) throw new AppError('Order not found', 404);
  if (order.status !== 'preparing' || order.delivery_partner_id) {
    throw new AppError('Order is no longer available', 400);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      delivery_partner_id: driverId,
      status: 'picked_up'
    },
    include: {
      deliveryPartner: {
        include: { user: { select: { full_name: true, phone_number: true } } }
      }
    }
  });

  const statusData = {
    orderId: order.id,
    status: 'picked_up',
    deliveryPartner: updatedOrder.deliveryPartner
  };

  if (io) {
    io.to('available_deliveries').emit('ORDER_ACCEPTED', { orderId: order.id });
    if (order.customer?.user_id) io.to(order.customer.user_id).emit('ORDER_STATUS_UPDATED', statusData);
    if (order.restaurant?.user_id) io.to(order.restaurant.user_id).emit('ORDER_STATUS_UPDATED', statusData);
  }

  return updatedOrder;
};

export const getDriverDeliveries = async (userId) => {
  const driver = await prisma.deliveryPartner.findUnique({ where: { user_id: userId } });
  if (!driver) throw new AppError('Driver profile not found', 404);

  return await prisma.order.findMany({
    where: {
      delivery_partner_id: driver.id,
      status: 'picked_up'
    },
    include: {
      restaurant: { select: { name: true, user_id: true, address: true } },
      deliveryAddress: true,
      customer: { include: { user: { select: { full_name: true, phone_number: true } } } }
    },
    orderBy: { updated_at: 'desc' }
  });
};

export const getDriverHistory = async (userId) => {
  const driver = await prisma.deliveryPartner.findUnique({ where: { user_id: userId } });
  if (!driver) throw new AppError('Driver profile not found', 404);

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
};
