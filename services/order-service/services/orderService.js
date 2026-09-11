import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const createOrder = async ({ userId, delivery_address_id, payment_method = 'cod', notes = '', items: payloadItems = [], io }) => {
  let customer = await prisma.customer.findUnique({
    where: { user_id: userId }
  });
  if (!customer) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User profile not found', 404);
    customer = await prisma.customer.create({
      data: { user_id: userId }
    });
  }

  const cart = await prisma.cart.findUnique({
    where: { customer_id: customer.id },
    include: {
      items: {
        include: { menuItem: true }
      }
    }
  });

  let orderItemsToCreate = [];
  let targetRestaurantId = cart?.restaurant_id;

  if (cart && cart.items && cart.items.length > 0) {
    orderItemsToCreate = cart.items.map((item) => ({
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    }));
    targetRestaurantId = cart.restaurant_id;
  } else if (Array.isArray(payloadItems) && payloadItems.length > 0) {
    orderItemsToCreate = payloadItems.map((item) => {
      const price = Number(item.price || item.unit_price || 100);
      const qty = Number(item.quantity || 1);
      return {
        menu_item_id: item.menu_item_id || item.id,
        quantity: qty,
        unit_price: price,
        total_price: price * qty
      };
    });
    if (payloadItems[0]?.restaurant_id && typeof payloadItems[0].restaurant_id === 'string') {
      targetRestaurantId = payloadItems[0].restaurant_id;
    }
  }

  if (orderItemsToCreate.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  if (!targetRestaurantId || typeof targetRestaurantId !== 'string') {
    if (orderItemsToCreate.length > 0 && orderItemsToCreate[0].menu_item_id) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: orderItemsToCreate[0].menu_item_id }
      });
      if (menuItem) {
        targetRestaurantId = menuItem.restaurant_id;
      }
    }
  }

  if (!targetRestaurantId || typeof targetRestaurantId !== 'string') {
    const defaultRestaurant = await prisma.restaurant.findFirst();
    if (defaultRestaurant) {
      targetRestaurantId = defaultRestaurant.id;
    }
  }

  if (!targetRestaurantId) {
    throw new AppError('No active restaurant found to process order', 400);
  }

  let address = null;
  if (delivery_address_id) {
    address = await prisma.address.findFirst({
      where: { id: delivery_address_id, user_id: userId }
    });
  }
  if (!address) {
    address = await prisma.address.findFirst({
      where: { user_id: userId }
    });
  }
  if (!address) {
    address = await prisma.address.create({
      data: {
        user_id: userId,
        address_line1: 'Current GPS Location',
        city: 'Local Area',
        state: 'Local State',
        postal_code: '000000',
        is_default: true
      }
    });
  }

  const total_amount = orderItemsToCreate.reduce((sum, item) => sum + item.total_price, 0);

  const order = await prisma.order.create({
    data: {
      customer_id: customer.id,
      restaurant_id: targetRestaurantId,
      delivery_address_id: address.id,
      total_amount,
      payment_method,
      payment_status: 'pending',
      status: 'placed',
      notes,
      items: {
        create: orderItemsToCreate
      }
    },
    include: {
      items: { include: { menuItem: true } },
      restaurant: true,
      customer: { include: { user: true } },
      deliveryAddress: true
    }
  });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cart_id: cart.id }
    });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { total_amount: 0.0, restaurant_id: null }
    });
  }

  if (io && order.restaurant) {
    io.to(order.restaurant.user_id).emit('NEW_ORDER', order);
  }

  return order;
};

export const getCustomerOrders = async (userId) => {
  let customer = await prisma.customer.findUnique({
    where: { user_id: userId }
  });
  
  if (!customer) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];
    customer = await prisma.customer.create({
      data: { user_id: userId }
    });
  }

  return await prisma.order.findMany({
    where: { customer_id: customer.id },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          image_url: true,
          address: true,
          user: { select: { phone_number: true } }
        }
      },
      deliveryPartner: { include: { user: { select: { full_name: true, phone_number: true } } } },
      items: { include: { menuItem: { select: { name: true, price: true, image_url: true } } } }
    },
    orderBy: { created_at: 'desc' }
  });
};

export const getOrderDetails = async (orderId, userId, userRole) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: true,
      deliveryAddress: true,
      deliveryPartner: { include: { user: { select: { full_name: true, phone_number: true } } } },
      customer: { include: { user: { select: { full_name: true, phone_number: true, email: true } } } },
      items: { include: { menuItem: true } }
    }
  });

  if (!order) throw new AppError('Order not found', 404);

  if (userRole === 'customer' && order.customer?.user_id !== userId) {
    throw new AppError('Unauthorized', 403);
  }
  if (userRole === 'restaurant' && order.restaurant?.user_id !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  return order;
};

export const updateOrderStatus = async (orderId, status, userId, userRole, io) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: true,
      customer: { include: { user: true } },
      deliveryPartner: { include: { user: true } }
    }
  });

  if (!order) throw new AppError('Order not found', 404);

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      restaurant: true,
      customer: { include: { user: true } },
      deliveryPartner: { include: { user: true } }
    }
  });

  if (io) {
    const statusData = {
      orderId,
      status,
      restaurant: updatedOrder.restaurant,
      deliveryPartner: updatedOrder.deliveryPartner
    };
    if (updatedOrder.customer?.user_id) io.to(updatedOrder.customer.user_id).emit('ORDER_STATUS_UPDATED', statusData);
    if (updatedOrder.restaurant?.user_id) io.to(updatedOrder.restaurant.user_id).emit('ORDER_STATUS_UPDATED', statusData);
    if (status === 'ready' || status === 'preparing') {
      io.to('available_deliveries').emit('ORDER_READY_FOR_PICKUP', statusData);
    }
  }

  return updatedOrder;
};

export const getDriverDeliveries = async (userId) => {
  const driver = await prisma.deliveryPartner.findUnique({
    where: { user_id: userId }
  });
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
  const driver = await prisma.deliveryPartner.findUnique({
    where: { user_id: userId }
  });
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

export const cancelOrder = async (orderId, userId, io) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: true,
      customer: { include: { user: { select: { email: true, full_name: true } } } }
    }
  });

  if (!order) throw new AppError('Order not found', 404);

  const customer = await prisma.customer.findUnique({ where: { user_id: userId } });
  if (!customer || order.customer_id !== customer.id) {
    throw new AppError('Not authorized to cancel this order', 403);
  }

  const allowedStatuses = ['placed', 'accepted'];
  if (!allowedStatuses.includes(order.status)) {
    throw new AppError(`Cannot cancel order in ${order.status} status.`, 400);
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'cancelled',
      payment_status: 'cancelled'
    }
  });

  if (io) {
    const data = { orderId: order.id, status: 'cancelled' };
    if (order.customer?.user_id) io.to(order.customer.user_id).emit('ORDER_STATUS_UPDATED', data);
    if (order.restaurant?.user_id) io.to(order.restaurant.user_id).emit('ORDER_STATUS_UPDATED', data);
  }

  return { order: updated };
};

/**
 * Called by payment-service (server-to-server) after successful Razorpay signature verification.
 * This is the ONLY place that sets payment_status = 'paid'.
 */
export const updateOrderPaymentStatus = async (orderId, paymentStatus) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError('Order not found', 404);

  return await prisma.order.update({
    where: { id: orderId },
    data: { payment_status: paymentStatus }
  });
};
