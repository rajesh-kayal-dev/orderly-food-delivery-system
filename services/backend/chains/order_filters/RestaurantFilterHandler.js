import OrderFilterHandler from './OrderFilterHandler.js';

export default class RestaurantFilterHandler extends OrderFilterHandler {
    handle(context) {
        if (context.filters.restaurantId) {
            context.where.restaurant_id = context.filters.restaurantId;
            context.countWhere.restaurant_id = context.filters.restaurantId;
        }
        return super.handle(context);
    }
}
