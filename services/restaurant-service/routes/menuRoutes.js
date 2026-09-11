import express from 'express';
import {
    getCategories,
    createCategory,
    getMenuItems,
    getFullMenu,
    createMenuItem,
    updateMenuItem,
    toggleAvailability,
    deleteMenuItem,
    getGlobalCategories
} from '../controllers/menuController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getMenuItems);
router.get('/global-categories', getGlobalCategories);
router.get('/categories/:restaurantId', getCategories);
router.get('/full/:restaurantId', getFullMenu);

// Protected routes (Restaurant owner only)
router.post('/categories', protect, authorize('restaurant'), createCategory);
router.post('/', protect, authorize('restaurant'), createMenuItem);
router.put('/:id', protect, authorize('restaurant'), updateMenuItem);
router.patch('/:id/toggle-availability', protect, authorize('restaurant'), toggleAvailability);
router.delete('/:id', protect, authorize('restaurant'), deleteMenuItem);

export default router;
