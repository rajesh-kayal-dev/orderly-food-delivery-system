import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import customerViewController from '../controllers/customerViewController.js';

router.post('/login', customerViewController.login);
router.get('/catalog', customerViewController.browseCatalog);
router.get('/catalog/search', customerViewController.searchCatalog);
router.get('/catalog/:itemId', customerViewController.getProductDetail);
router.get('/cart', protect, customerViewController.getCart);
router.post('/cart/items', protect, customerViewController.addToCart);
router.put('/cart/items/:itemId', protect, customerViewController.updateCartItem);
router.delete('/cart/items/:itemId', protect, customerViewController.removeCartItem);
router.delete('/cart', protect, customerViewController.clearCart);
router.post('/checkout', protect, customerViewController.checkout);
router.get('/orders', protect, customerViewController.trackOrders);
router.get('/orders/favorite', protect, customerViewController.getMonthlyFavorite);

export default router;