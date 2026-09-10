import express from 'express';
import { getRestaurants, getRestaurantById, getMyRestaurantProfile, updateMyRestaurantProfile, createRestaurantProfile } from '../controllers/restaurantController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-profile', protect, authorize('restaurant'), getMyRestaurantProfile);
router.put('/my-profile', protect, authorize('restaurant'), updateMyRestaurantProfile);
router.post('/', protect, authorize('restaurant'), createRestaurantProfile);
router.get('/', getRestaurants);
router.get('/:id', getRestaurantById);

export default router;
