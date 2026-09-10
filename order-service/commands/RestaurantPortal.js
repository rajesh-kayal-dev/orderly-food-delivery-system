class RestaurantPortal {
    constructor() {
        this.commandsHistory = [];
    }

    async submitCommand(command) {
        this.commandsHistory.push(command);
        return await command.execute();
    }
}

export default new RestaurantPortal();
