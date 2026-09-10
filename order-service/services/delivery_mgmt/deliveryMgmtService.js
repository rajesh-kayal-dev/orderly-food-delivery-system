const prisma = require('../../config/prisma');

class DeliveryMgmtService {
    async getAvailableDeliveries() {
        return await prisma.order.findMany({
            where: {
                status: 'preparing',
                delivery_partner_id: null
            },
            include: {
                restaurant: { select: { name: true, user_id: true, address: true } },
                deliveryAddress: { select: { address_line1: true, city: true } },
                customer: { include: { user: { select: { full_name: true, phone_number: true } } } }
            },
            orderBy: { updated_at: 'asc' }
        });
    }

    async acceptByDriver(orderId, driverId, io) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { customer: true, restaurant: true }
        });

        if (!order) throw new Error('Order not found');
        if (order.status !== 'preparing' || order.delivery_partner_id) {
            throw new Error('Order is no longer available');
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                delivery_partner_id: driverId,
                status: 'picked_up'
            },
            include: {
                deliveryPartner: {
                    include: { user: { select: { full_name: true, phone_number: true } } }
                }
            }
        });

        const statusData = {
            orderId: order.id,
            status: 'picked_up',
            deliveryPartner: updatedOrder.deliveryPartner
        };

        if (io) {
            io.to('available_deliveries').emit('ORDER_ACCEPTED', { orderId: order.id });
            if (order.customer?.user_id) io.to(order.customer.user_id).emit('ORDER_STATUS_UPDATED', statusData);
            if (order.restaurant?.user_id) io.to(order.restaurant.user_id).emit('ORDER_STATUS_UPDATED', statusData);
        }

        return updatedOrder;
    }

    async getDriverDeliveries(userId) {
        const driver = await prisma.deliveryPartner.findUnique({ where: { user_id: userId } });
        if (!driver) throw new Error('Driver profile not found');

        return await prisma.order.findMany({
            where: {
                delivery_partner_id: driver.id,
                status: 'picked_up'
            },
            include: {
                restaurant: { select: { name: true, user_id: true, address: true } },
                deliveryAddress: true,
                customer: { include: { user: { select: { full_name: true, phone_number: true } } } }
            },
            orderBy: { updated_at: 'desc' }
        });
    }

    async getDriverHistory(userId) {
        const driver = await prisma.deliveryPartner.findUnique({ where: { user_id: userId } });
        if (!driver) throw new Error('Driver profile not found');

        return await prisma.order.findMany({
            where: {
                delivery_partner_id: driver.id,
                status: { in: ['delivered', 'completed'] }
            },
            include: {
                restaurant: { select: { name: true, user_id: true, address: true } },
                deliveryAddress: true
            },
            orderBy: { updated_at: 'desc' }
        });
    }
}

module.exports = new DeliveryMgmtService();
