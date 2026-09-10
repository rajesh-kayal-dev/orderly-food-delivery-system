import RestaurantCommand from './RestaurantCommand.js';

class MarkReadyCommand extends RestaurantCommand {
    constructor(fulfillmentService, orderId, user, io) {
        super();
        this.fulfillmentService = fulfillmentService;
        this.orderId = orderId;
        this.user = user;
        this.io = io;
    }

    async execute() {
        return await this.fulfillmentService.updateStatus(this.orderId, 'preparing', this.user, this.io);
    }
}

export default MarkReadyCommand;
