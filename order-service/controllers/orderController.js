import orderService from '../services/orderService.js';
import restaurantOpsService from '../services/restaurant_ops/restaurantOpsService.js';
import deliveryMgmtService from '../services/delivery_mgmt/deliveryMgmtService.js';

export const createOrder = async (req, res) => {
    try {
        const { delivery_address_id, payment_method, notes } = req.body;
        const order = await orderService.createOrder({
            userId: req.user.id,
            delivery_address_id,
            payment_method,
            notes,
            io: req.io
        });
        res.status(201).json({ success: true, data: order });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getCustomerOrders = async (req, res) => {
    try {
        const orders = await orderService.getCustomerOrders(req.user.id);
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getOrderDetails = async (req, res) => {
    try {
        const order = await orderService.getOrderDetails(req.params.id, req.user.id, req.user.role);
        res.json({ success: true, data: order });
    } catch (error) {
        console.error(error);
        const statusCode = error.message === 'Order not found' ? 404 : error.message === 'Unauthorized' ? 403 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await orderService.updateOrderStatus(req.params.id, status, req.user.id, req.user.role, req.io);
        res.json({ success: true, data: order });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const result = await orderService.cancelOrder(req.params.id, req.user.id, req.io);
        res.json({ success: true, data: result.order });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getRestaurantOrders = async (req, res) => {
    try {
        const { status, date } = req.query;
        const result = await restaurantOpsService.getRestaurantOrders(req.user.id, status, date);
        res.json({ success: true, data: result.orders, counts: result.counts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAvailableDeliveries = async (req, res) => {
    try {
        const deliveries = await deliveryMgmtService.getAvailableDeliveries();
        res.json({ success: true, data: deliveries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const acceptDeliveryByDriver = async (req, res) => {
    try {
        const order = await deliveryMgmtService.acceptByDriver(req.params.id, req.user.id, req.io);
        res.json({ success: true, data: order });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getDriverDeliveries = async (req, res) => {
    try {
        const deliveries = await deliveryMgmtService.getDriverDeliveries(req.user.id);
        res.json({ success: true, data: deliveries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getDriverHistory = async (req, res) => {
    try {
        const history = await deliveryMgmtService.getDriverHistory(req.user.id);
        res.json({ success: true, data: history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
