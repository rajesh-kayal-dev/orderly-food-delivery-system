import express from 'express';
import {
    createOrder,
    getCustomerOrders,
    getOrderDetails,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
    getRestaurantOrders,
    getRestaurantYearlySummary,
    getAvailableDeliveries,
    acceptDeliveryByDriver,
    getDriverDeliveries,
    getDriverHistory
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Customer Order Routes
router.post('/', protect, authorize('customer'), createOrder);
router.get('/customer', protect, authorize('customer'), getCustomerOrders);
router.get('/me', protect, authorize('customer'), getCustomerOrders);

// Restaurant Order Routes
router.get('/restaurant/me/yearly-summary', protect, authorize('restaurant'), getRestaurantYearlySummary);
router.get('/restaurant/me', protect, authorize('restaurant'), getRestaurantOrders);
router.get('/restaurant', protect, authorize('restaurant'), getRestaurantOrders);

// Delivery Partner Order Routes
router.get('/deliveries/available', protect, authorize('delivery_partner'), getAvailableDeliveries);
router.get('/available-deliveries', protect, authorize('delivery_partner'), getAvailableDeliveries);

router.get('/driver/me/history', protect, authorize('delivery_partner'), getDriverHistory);
router.get('/driver-history', protect, authorize('delivery_partner'), getDriverHistory);

router.get('/driver/me', protect, authorize('delivery_partner'), getDriverDeliveries);
router.get('/driver-deliveries', protect, authorize('delivery_partner'), getDriverDeliveries);

router.put('/:id/accept-delivery', protect, authorize('delivery_partner'), acceptDeliveryByDriver);
router.post('/:id/accept', protect, authorize('delivery_partner'), acceptDeliveryByDriver);

// General Order Status & Cancellation
router.get('/:id', protect, getOrderDetails);
router.put('/:id/status', protect, updateOrderStatus);
router.put('/:id/payment-status', protect, updatePaymentStatus);
router.post('/:id/cancel', protect, authorize('customer'), cancelOrder);

export default router;
