const prisma = require('../config/prisma');

class CartService {
    async getCart(userId) {
        const customer = await prisma.customer.findUnique({ where: { user_id: userId } });
        if (!customer) throw new Error('Customer not found');

        let cart = await prisma.cart.findUnique({
            where: { customer_id: customer.id },
            include: {
                items: {
                    include: { menuItem: true }
                }
            }
        });

        if (!cart) {
            return { items: [], restaurant_id: null };
        }

        return cart;
    }

    async addItem(userId, itemData) {
        const { menu_item_id, quantity, restaurant_id } = itemData;
        const customer = await prisma.customer.findUnique({ where: { user_id: userId } });
        if (!customer) throw new Error('Customer not found');

        if (!restaurant_id) throw new Error('restaurant_id is required');
        if (!menu_item_id) throw new Error('menu_item_id is required');
        if (!quantity || Number(quantity) <= 0) throw new Error('quantity must be greater than 0');

        const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurant_id } });
        if (!restaurant) throw new Error('Restaurant not found');
        if (restaurant.is_active === false) {
            const error = new Error('Restaurant is currently closed');
            error.type = 'RESTAURANT_CLOSED';
            throw error;
        }

        const menuItem = await prisma.menuItem.findUnique({ where: { id: menu_item_id } });
        if (!menuItem) throw new Error('Menu item not found');
        if (String(menuItem.restaurant_id) !== String(restaurant_id)) {
            throw new Error('Menu item does not belong to this restaurant');
        }
        if (!menuItem.is_available) {
            throw new Error('Menu item is currently unavailable');
        }
        
        let cart = await prisma.cart.findUnique({ where: { customer_id: customer.id } });

        if (!cart || cart.restaurant_id !== restaurant_id) {
            if (cart) {
                await prisma.cartItem.deleteMany({ where: { cart_id: cart.id } });
                cart = await prisma.cart.update({
                    where: { id: cart.id },
                    data: { restaurant_id }
                });
            } else {
                cart = await prisma.cart.create({
                    data: { customer_id: customer.id, restaurant_id }
                });
            }
        }

        let cartItem = await prisma.cartItem.findFirst({ 
            where: { cart_id: cart.id, menu_item_id } 
        });

        const MAX_QUANTITY = 20;

        if (cartItem) {
            const newQuantity = cartItem.quantity + Number(quantity);
            if (newQuantity > MAX_QUANTITY) {
                throw new Error(`Maximum quantity per item is ${MAX_QUANTITY}`);
            }
            cartItem = await prisma.cartItem.update({
                where: { id: cartItem.id },
                data: { quantity: newQuantity }
            });
        } else {
            if (Number(quantity) > MAX_QUANTITY) {
                throw new Error(`Maximum quantity per item is ${MAX_QUANTITY}`);
            }
            cartItem = await prisma.cartItem.create({
                data: {
                    cart_id: cart.id,
                    menu_item_id,
                    quantity: Number(quantity),
                    price: menuItem.price
                }
            });
        }
        return cartItem;
    }

    async updateQuantity(itemId, quantity) {
        const MAX_QUANTITY = 20;
        const cartItem = await prisma.cartItem.findUnique({ where: { id: itemId } });
        if (!cartItem) throw new Error('Cart item not found');

        if (quantity <= 0) {
            await prisma.cartItem.delete({ where: { id: itemId } });
            return null;
        } else {
            if (quantity > MAX_QUANTITY) {
                throw new Error(`Maximum quantity per item is ${MAX_QUANTITY}`);
            }
            return await prisma.cartItem.update({
                where: { id: itemId },
                data: { quantity }
            });
        }
    }

    async removeItem(itemId) {
        const cartItem = await prisma.cartItem.findUnique({ where: { id: itemId } });
        if (cartItem) {
            await prisma.cartItem.delete({ where: { id: itemId } });
        }
    }

    async clearCart(userId) {
        const customer = await prisma.customer.findUnique({ where: { user_id: userId } });
        if (!customer) throw new Error('Customer not found');

        const cart = await prisma.cart.findUnique({ where: { customer_id: customer.id } });
        if (cart) {
            await prisma.cartItem.deleteMany({ where: { cart_id: cart.id } });
            await prisma.cart.update({
                where: { id: cart.id },
                data: { restaurant_id: null }
            });
        }
    }
}

module.exports = new CartService();
