import express from 'express';
const router = express.Router();
import { getCart, addItemToCart, updateItemQuantity, removeItem, clearCart } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

router.use(protect); // All cart routes require authentication

router.get('/', getCart);
router.post('/items', addItemToCart);
router.put('/items/:itemId', updateItemQuantity);
router.delete('/items/:itemId', removeItem);
router.delete('/', clearCart);

export default router;
