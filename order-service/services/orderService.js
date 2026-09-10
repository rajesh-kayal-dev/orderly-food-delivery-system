const prisma = require('../config/prisma');

class OrderService {
    async createOrder({ userId, delivery_address_id, payment_method = 'cod', notes = '', io }) {
        const customer = await prisma.customer.findUnique({
            where: { user_id: userId }
        });
        if (!customer) throw new Error('Customer profile not found');

        const cart = await prisma.cart.findUnique({
            where: { customer_id: customer.id },
            include: {
                items: {
                    include: { menuItem: true }
                }
            }
        });

        if (!cart || !cart.items || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        if (!cart.restaurant_id) {
            throw new Error('Cart does not have an associated restaurant');
        }

        const address = await prisma.address.findFirst({
            where: { id: delivery_address_id, user_id: userId }
        });
        if (!address) throw new Error('Delivery address not found or unauthorized');

        const total_amount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const order = await prisma.order.create({
            data: {
                customer_id: customer.id,
                restaurant_id: cart.restaurant_id,
                delivery_address_id: address.id,
                total_amount,
                payment_method,
                payment_status: payment_method === 'cod' ? 'pending' : 'paid',
                status: 'placed',
                notes,
                items: {
                    create: cart.items.map(item => ({
                        menu_item_id: item.menu_item_id,
                        quantity: item.quantity,
                        unit_price: item.price,
                        total_price: item.price * item.quantity
                    }))
                }
            },
            include: {
                items: { include: { menuItem: true } },
                restaurant: true,
                customer: { include: { user: true } },
                deliveryAddress: true
            }
        });

        await prisma.cartItem.deleteMany({
            where: { cart_id: cart.id }
        });
        await prisma.cart.update({
            where: { id: cart.id },
            data: { total_amount: 0.0, restaurant_id: null }
        });

        if (io && order.restaurant) {
            io.to(order.restaurant.user_id).emit('NEW_ORDER', order);
        }

        return order;
    }

    async getCustomerOrders(userId) {
        const customer = await prisma.customer.findUnique({
            where: { user_id: userId }
        });
        if (!customer) throw new Error('Customer profile not found');

        return await prisma.order.findMany({
            where: { customer_id: customer.id },
            include: {
                restaurant: { select: { name: true, image_url: true } },
                deliveryPartner: { include: { user: { select: { full_name: true, phone_number: true } } } },
                items: { include: { menuItem: { select: { name: true, price: true } } } }
            },
            orderBy: { created_at: 'desc' }
        });
    }

    async getOrderDetails(orderId, userId, userRole) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                restaurant: true,
                deliveryAddress: true,
                deliveryPartner: { include: { user: { select: { full_name: true, phone_number: true } } } },
                customer: { include: { user: { select: { full_name: true, phone_number: true, email: true } } } },
                items: { include: { menuItem: true } }
            }
        });

        if (!order) throw new Error('Order not found');

        if (userRole === 'customer' && order.customer.user_id !== userId) {
            throw new Error('Unauthorized');
        }
        if (userRole === 'restaurant' && order.restaurant.user_id !== userId) {
            throw new Error('Unauthorized');
        }

        return order;
    }

    async updateOrderStatus(orderId, status, userId, userRole, io) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                restaurant: true,
                customer: { include: { user: true } },
                deliveryPartner: { include: { user: true } }
            }
        });

        if (!order) throw new Error('Order not found');

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: {
                restaurant: true,
                customer: { include: { user: true } },
                deliveryPartner: { include: { user: true } }
            }
        });

        if (io) {
            const statusData = { orderId, status };
            if (updatedOrder.customer?.user_id) io.to(updatedOrder.customer.user_id).emit('ORDER_STATUS_UPDATED', statusData);
            if (updatedOrder.restaurant?.user_id) io.to(updatedOrder.restaurant.user_id).emit('ORDER_STATUS_UPDATED', statusData);
        }

        return updatedOrder;
    }

    async getDriverDeliveries(userId) {
        const driver = await prisma.deliveryPartner.findUnique({
            where: { user_id: userId }
        });
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
        const driver = await prisma.deliveryPartner.findUnique({
            where: { user_id: userId }
        });
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

    async cancelOrder(orderId, userId, io) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                restaurant: true,
                customer: { include: { user: { select: { email: true, full_name: true } } } }
            }
        });

        if (!order) throw new Error('Order not found');

        const customer = await prisma.customer.findUnique({ where: { user_id: userId } });
        if (!customer || order.customer_id !== customer.id) {
            throw new Error('Not authorized to cancel this order');
        }

        const allowedStatuses = ['placed', 'accepted'];
        if (!allowedStatuses.includes(order.status)) {
            throw new Error(`Cannot cancel order in ${order.status} status.`);
        }

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'cancelled',
                payment_status: 'cancelled'
            }
        });

        if (io) {
            const data = { orderId: order.id, status: 'cancelled' };
            if (order.customer?.user_id) io.to(order.customer.user_id).emit('ORDER_STATUS_UPDATED', data);
            if (order.restaurant?.user_id) io.to(order.restaurant.user_id).emit('ORDER_STATUS_UPDATED', data);
        }

        return { order: updated };
    }
}

module.exports = new OrderService();
