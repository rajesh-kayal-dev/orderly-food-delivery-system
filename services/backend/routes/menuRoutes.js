import express from 'express';
const router = express.Router();
import { getCategories, 
    getMenuItems, 
    getFullMenu, 
    getGlobalCategories,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability,
    createCategory } from '../controllers/menuController.js';
import { protect } from '../middleware/authMiddleware.js';

router.get('/global-categories', getGlobalCategories);
router.get('/categories/:restaurantId', getCategories);
router.get('/', getMenuItems);
router.get('/items/:categoryId', getMenuItems); // Legacy support
router.get('/full/:restaurantId', getFullMenu);

// Restaurant specific management
router.post('/', protect, createMenuItem);
router.post('/categories', protect, createCategory);
router.put('/:id', protect, updateMenuItem);
router.patch('/:id/toggle-availability', protect, toggleAvailability);
router.delete('/:id', protect, deleteMenuItem);

export default router;
