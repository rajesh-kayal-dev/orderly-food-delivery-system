import express from 'express';
import {
    getCart,
    addItemToCart,
    updateItemQuantity,
    removeItem,
    clearCart
} from '../controllers/cartController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('customer'));

router.get('/', getCart);
router.post('/items', addItemToCart);
router.put('/items/:itemId', updateItemQuantity);
router.delete('/items/:itemId', removeItem);
router.delete('/', clearCart);

export default router;
