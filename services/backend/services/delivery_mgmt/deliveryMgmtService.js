import { Order, Customer, Restaurant, DeliveryPartner, User, Address } from '../../models.js';
import { Op } from 'sequelize';

/**
 * Interface: IDeliveryMgmtAPI
 */
class DeliveryMgmtService {
    async getAvailableDeliveries() {
        return await Order.findAll({
            where: {
                status: { [Op.in]: ['preparing', 'ready'] },
                delivery_partner_id: null
            },
            include: [
                { model: Restaurant, attributes: ['name', 'user_id', 'location'] },
                { model: Address, attributes: ['street', 'city'] },
                { model: Customer, include: [{ model: User, attributes: ['full_name', 'phone_number'] }] }
            ],
            order: [['updated_at', 'ASC']]
        });
    }

    async acceptByDriver(orderId, userId, io) {
        // Look up the driver profile by the authenticated user's ID
        const driver = await DeliveryPartner.findOne({ where: { user_id: userId } });
        if (!driver) throw new Error('Delivery partner profile not found');

        const order = await Order.findByPk(orderId, {
            include: [{ model: Customer }, { model: Restaurant }]
        });

        if (!order) throw new Error('Order not found');
        if (!['preparing', 'ready'].includes(order.status) || order.delivery_partner_id) {
            throw new Error('Order is no longer available');
        }

        order.delivery_partner_id = driver.id;
        order.status = 'assigned';
        await order.save();

        const fullOrder = await Order.findByPk(order.id, {
            include: [
                { 
                    model: DeliveryPartner, 
                    include: [{ model: User, attributes: ['full_name', 'phone_number'] }] 
                }
            ]
        });

        const statusData = { 
            orderId: order.id, 
            status: 'assigned',
            deliveryPartner: fullOrder.DeliveryPartner
        };

        if (io) {
            // Tell all drivers in the available pool that this order is taken
            io.to('available_deliveries').emit('ORDER_ACCEPTED', { orderId: order.id });
            // Notify assigned driver specifically
            io.to(userId).emit('DRIVER_ASSIGNED', statusData);
            // Notify customer
            if (order.Customer) io.to(order.Customer.user_id).emit('ORDER_STATUS_UPDATED', statusData);
            if (order.Customer) io.to(order.Customer.user_id).emit('DRIVER_ASSIGNED', statusData);
            // Notify restaurant
            if (order.Restaurant) io.to(order.Restaurant.user_id).emit('ORDER_STATUS_UPDATED', statusData);
        }

        return order;
    }

    async markPickedUpByDriver(orderId, userId, io) {
        const driver = await DeliveryPartner.findOne({ where: { user_id: userId } });
        if (!driver) throw new Error('Driver profile not found');

        const order = await Order.findByPk(orderId, {
            include: [{ model: Customer }, { model: Restaurant }]
        });

        if (!order) throw new Error('Order not found');
        if (order.delivery_partner_id !== driver.id) {
            throw new Error('Order is not assigned to you');
        }
        if (order.status !== 'assigned' && order.status !== 'preparing') {
            throw new Error(`Cannot pick up order in '${order.status}' status`);
        }

        order.status = 'picked_up';
        await order.save();

        const statusData = {
            orderId: order.id,
            status: 'picked_up',
            deliveryPartnerId: driver.id
        };

        if (io) {
            if (order.Customer) io.to(order.Customer.user_id).emit('ORDER_STATUS_UPDATED', statusData);
            if (order.Restaurant) io.to(order.Restaurant.user_id).emit('ORDER_STATUS_UPDATED', statusData);
        }

        return order;
    }

    async getDriverDeliveries(userId) {
        try {
            const driver = await DeliveryPartner.findOne({ where: { user_id: userId } });
            if (!driver) return [];

            return await Order.findAll({
                where: {
                    delivery_partner_id: driver.id,
                    status: { [Op.in]: ['assigned', 'picked_up'] }
                },
                include: [
                    { model: Restaurant, attributes: ['name', 'user_id', 'location', 'latitude', 'longitude'] },
                    { model: Address, attributes: ['street', 'city', 'latitude', 'longitude'] },
                    { model: Customer, include: [{ model: User, attributes: ['full_name', 'phone_number'] }] }
                ],
                order: [['updated_at', 'DESC']]
            });
        } catch (err) {
            console.error('[getDriverDeliveries Error]:', err.message);
            return [];
        }
    }

    async getDriverHistory(userId) {
        try {
            const driver = await DeliveryPartner.findOne({ where: { user_id: userId } });
            if (!driver) return [];

            return await Order.findAll({
                where: {
                    delivery_partner_id: driver.id,
                    status: { [Op.in]: ['delivered', 'completed'] }
                },
                include: [
                    { model: Restaurant, attributes: ['name', 'user_id', 'location'] },
                    { model: Address, attributes: ['street', 'city'] }
                ],
                order: [['updated_at', 'DESC']]
            });
        } catch (err) {
            console.error('[getDriverHistory Error]:', err.message);
            return [];
        }
    }
}

export default new DeliveryMgmtService();
