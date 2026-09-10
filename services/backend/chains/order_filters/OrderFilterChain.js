import RestaurantFilterHandler from './RestaurantFilterHandler.js';
import StatusFilterHandler from './StatusFilterHandler.js';
import DateFilterHandler from './DateFilterHandler.js';
import PaginationFilterHandler from './PaginationFilterHandler.js';

export default class OrderFilterChain {
    static buildContext(filters) {
        const context = {
            filters,
            where: {},
            countWhere: {},
            pagination: {}
        };

        const restaurantHandler = new RestaurantFilterHandler();
        const statusHandler = new StatusFilterHandler();
        const dateHandler = new DateFilterHandler();
        const paginationHandler = new PaginationFilterHandler();

        // Chain the handlers correctly
        // restaurantHandler -> statusHandler -> dateHandler -> paginationHandler
        restaurantHandler.setNext(statusHandler).setNext(dateHandler).setNext(paginationHandler);

        // Execute the chain starting from the first handler
        return restaurantHandler.handle(context);
    }
}
