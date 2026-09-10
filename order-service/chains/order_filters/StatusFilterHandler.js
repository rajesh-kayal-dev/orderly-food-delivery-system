import OrderFilterHandler from './OrderFilterHandler.js';
import { Op } from 'sequelize';

class StatusFilterHandler extends OrderFilterHandler {
    handle(context) {
        if (context.filters.statusFilter && context.filters.statusFilter !== 'all') {
            if (context.filters.statusFilter === 'delivered') {
                context.where.status = { [Op.in]: ['delivered', 'completed'] };
            } else {
                context.where.status = context.filters.statusFilter;
            }
        }
        // status is intentially NOT copied to countWhere since countWhere needs all statuses for counts
        return super.handle(context);
    }
}

export default StatusFilterHandler;
