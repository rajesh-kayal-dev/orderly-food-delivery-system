import OrderFilterHandler from './OrderFilterHandler.js';

class RestaurantFilterHandler extends OrderFilterHandler {
    handle(context) {
        if (context.filters.restaurantId) {
            context.where.restaurant_id = context.filters.restaurantId;
            context.countWhere.restaurant_id = context.filters.restaurantId;
        }
        return super.handle(context);
    }
}

export default RestaurantFilterHandler;
