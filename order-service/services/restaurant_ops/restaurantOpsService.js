const prisma = require('../../config/prisma');

class RestaurantOpsService {
    async getRestaurantOrders(userId, statusFilter, date) {
        const restaurant = await prisma.restaurant.findUnique({
            where: { user_id: userId }
        });
        if (!restaurant) throw new Error('Restaurant not found for this user');

        const where = { restaurant_id: restaurant.id };

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            where.created_at = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        if (statusFilter && statusFilter !== 'all') {
            if (statusFilter === 'delivered') {
                where.status = { in: ['delivered', 'completed'] };
            } else {
                where.status = statusFilter;
            }
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                customer: {
                    include: {
                        user: {
                            select: { email: true, full_name: true, phone_number: true }
                        }
                    }
                },
                deliveryPartner: {
                    include: {
                        user: {
                            select: { full_name: true, phone_number: true }
                        }
                    }
                },
                items: {
                    include: {
                        menuItem: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const allStatusOrders = await prisma.order.groupBy({
            by: ['status'],
            where: {
                restaurant_id: restaurant.id,
                ...(date && { created_at: where.created_at })
            },
            _count: {
                status: true
            }
        });

        const counts = {
            pending: 0,
            accepted: 0,
            preparing: 0,
            picked_up: 0,
            delivered: 0,
            cancelled: 0,
            refunded: 0
        };

        allStatusOrders.forEach(sc => {
            const countVal = sc._count.status;
            if (sc.status === 'completed') {
                counts.delivered += countVal;
            } else if (counts.hasOwnProperty(sc.status)) {
                counts[sc.status] += countVal;
            }
        });

        return { orders, counts };
    }

    async getRestaurantYearlySummary(userId, year) {
        const restaurant = await prisma.restaurant.findUnique({
            where: { user_id: userId }
        });
        if (!restaurant) throw new Error('Restaurant not found for this user');

        const targetYear = parseInt(year) || new Date().getFullYear();
        const startOfYear = new Date(targetYear, 0, 1, 0, 0, 0, 0);
        const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

        const deliveredOrders = await prisma.order.findMany({
            where: {
                restaurant_id: restaurant.id,
                status: { in: ['delivered', 'completed'] },
                created_at: {
                    gte: startOfYear,
                    lte: endOfYear
                }
            },
            include: {
                items: {
                    include: {
                        menuItem: {
                            include: { category: true }
                        }
                    }
                }
            }
        });

        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthlyRevenue = MONTHS.map(month => ({ month, revenue: 0 }));
        deliveredOrders.forEach(order => {
            const m = new Date(order.created_at).getMonth();
            const subtotal = Number(order.total_amount || 0);
            monthlyRevenue[m].revenue += subtotal;
        });

        const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
        const totalOrders = deliveredOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const dishMap = {};
        deliveredOrders.forEach(order => {
            (order.items || []).forEach(item => {
                const id = item.menu_item_id;
                const name = item.menuItem?.name || 'Item';
                if (!dishMap[id]) dishMap[id] = { name, quantity: 0, revenue: 0 };
                dishMap[id].quantity += Number(item.quantity);
                dishMap[id].revenue += Number(item.total_price || 0);
            });
        });
        const topDishes = Object.values(dishMap)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        const catMap = {};
        deliveredOrders.forEach(order => {
            (order.items || []).forEach(item => {
                const catName = item.menuItem?.category?.name || 'Other';
                if (!catMap[catName]) catMap[catName] = 0;
                catMap[catName] += Number(item.quantity);
            });
        });
        const categoryDistribution = Object.entries(catMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const recentOrders = await prisma.order.findMany({
            where: {
                restaurant_id: restaurant.id,
                created_at: {
                    gte: startOfYear,
                    lte: endOfYear
                }
            },
            include: {
                customer: {
                    include: { user: { select: { full_name: true } } }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return {
            stats: { totalRevenue, totalOrders, avgOrderValue },
            monthlyRevenue,
            topDishes,
            categoryDistribution,
            recentOrders: recentOrders.map(o => ({
                id: o.id,
                customerName: o.customer?.user?.full_name || 'Unknown',
                subtotal: Number(o.total_amount || 0),
                createdAt: o.created_at,
                status: o.status
            }))
        };
    }
}

module.exports = new RestaurantOpsService();
