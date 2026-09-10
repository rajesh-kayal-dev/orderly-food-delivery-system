import express from 'express';
import {
    createOrder,
    getCustomerOrders,
    getOrderDetails,
    updateOrderStatus,
    cancelOrder,
    getRestaurantOrders,
    getAvailableDeliveries,
    acceptDeliveryByDriver,
    getDriverDeliveries,
    getDriverHistory
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('customer'), createOrder);
router.get('/customer', protect, authorize('customer'), getCustomerOrders);
router.get('/me', protect, authorize('customer'), getCustomerOrders);
router.get('/restaurant', protect, authorize('restaurant'), getRestaurantOrders);
router.get('/available-deliveries', protect, authorize('delivery_partner'), getAvailableDeliveries);
router.post('/:id/accept', protect, authorize('delivery_partner'), acceptDeliveryByDriver);
router.get('/driver-deliveries', protect, authorize('delivery_partner'), getDriverDeliveries);
router.get('/driver-history', protect, authorize('delivery_partner'), getDriverHistory);
router.get('/:id', protect, getOrderDetails);
router.put('/:id/status', protect, updateOrderStatus);
router.post('/:id/cancel', protect, authorize('customer'), cancelOrder);

export default router;
