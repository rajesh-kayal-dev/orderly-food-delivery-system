import express from 'express';
const router = express.Router();
import { getRestaurants, getRestaurantById } from '../controllers/restaurantController.js';

router.get('/', getRestaurants);
router.get('/:id', getRestaurantById);

export default router;
