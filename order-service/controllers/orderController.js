import * as orderService from '../services/orderService.js';
import * as restaurantOpsService from '../services/restaurant_ops/restaurantOpsService.js';
import * as deliveryMgmtService from '../services/delivery_mgmt/deliveryMgmtService.js';

export const createOrder = async (req, res, next) => {
  try {
    const { delivery_address_id, payment_method, notes } = req.body;
    const order = await orderService.createOrder({
      userId: req.user.id,
      delivery_address_id,
      payment_method,
      notes,
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
