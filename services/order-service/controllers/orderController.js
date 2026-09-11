import * as orderService from '../services/orderService.js';
import * as restaurantOpsService from '../services/restaurant_ops/restaurantOpsService.js';
import * as deliveryMgmtService from '../services/delivery_mgmt/deliveryMgmtService.js';

export const createOrder = async (req, res, next) => {
  try {
    const { delivery_address_id, payment_method, notes, items } = req.body;
    const order = await orderService.createOrder({
      userId: req.user.id,
      delivery_address_id,
      payment_method,
      notes,
      items,
      io: req.io
    });
    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const getCustomerOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getCustomerOrders(req.user.id);
    return res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetails = async (req, res, next) => {
  try {
    const order = await orderService.getOrderDetails(req.params.id, req.user.id, req.user.role);
    return res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status, req.user.id, req.user.role, req.io);
    return res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/orders/:id/payment-status
 * Called server-to-server by payment-service to authoritatively update payment_status.
 * This is NOT triggered by the frontend — only by the payment-service after signature verification.
 */
export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { payment_status } = req.body;
    if (!payment_status) {
      return res.status(400).json({ success: false, message: 'payment_status is required' });
    }
    const order = await orderService.updateOrderPaymentStatus(req.params.id, payment_status);
    return res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const result = await orderService.cancelOrder(req.params.id, req.user.id, req.io);
    return res.json({ success: true, data: result.order });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantOrders = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const result = await restaurantOpsService.getRestaurantOrders(req.user.id, status, date);
    return res.json({ success: true, data: result.orders, counts: result.counts });
  } catch (error) {
    next(error);
  }
};

export const getAvailableDeliveries = async (req, res, next) => {
  try {
    const deliveries = await deliveryMgmtService.getAvailableDeliveries();
    return res.json({ success: true, data: deliveries });
  } catch (error) {
    next(error);
  }
};

export const acceptDeliveryByDriver = async (req, res, next) => {
  try {
    const order = await deliveryMgmtService.acceptByDriver(req.params.id, req.user.id, req.io);
    return res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const getDriverDeliveries = async (req, res, next) => {
  try {
    const deliveries = await deliveryMgmtService.getDriverDeliveries(req.user.id);
    return res.json({ success: true, data: deliveries });
  } catch (error) {
    next(error);
  }
};

export const getDriverHistory = async (req, res, next) => {
  try {
    const history = await deliveryMgmtService.getDriverHistory(req.user.id);
    return res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantYearlySummary = async (req, res, next) => {
  try {
    const { year } = req.query;
    const summary = await restaurantOpsService.getRestaurantYearlySummary(req.user.id, year);
    return res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

