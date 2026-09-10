import prisma from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const MAX_QUANTITY = 20;

export const getCart = async (userId) => {
  const customer = await prisma.customer.findUnique({ where: { user_id: userId } });
  if (!customer) throw new AppError('Customer not found', 404);

  const cart = await prisma.cart.findUnique({
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
};

export const addItem = async (userId, itemData) => {
  const { menu_item_id, quantity, restaurant_id } = itemData;
  const customer = await prisma.customer.findUnique({ where: { user_id: userId } });
  if (!customer) throw new AppError('Customer not found', 404);

  if (!restaurant_id) throw new AppError('restaurant_id is required', 400);
  if (!menu_item_id) throw new AppError('menu_item_id is required', 400);
  if (!quantity || Number(quantity) <= 0) throw new AppError('quantity must be greater than 0', 400);

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurant_id } });
  if (!restaurant) throw new AppError('Restaurant not found', 404);

  const menuItem = await prisma.menuItem.findUnique({ where: { id: menu_item_id } });
  if (!menuItem) throw new AppError('Menu item not found', 404);
  if (String(menuItem.restaurant_id) !== String(restaurant_id)) {
    throw new AppError('Menu item does not belong to this restaurant', 400);
  }
  if (!menuItem.is_available) {
    throw new AppError('Menu item is currently unavailable', 400);
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

  if (cartItem) {
    const newQuantity = cartItem.quantity + Number(quantity);
    if (newQuantity > MAX_QUANTITY) {
      throw new AppError(`Maximum quantity per item is ${MAX_QUANTITY}`, 400);
    }
    cartItem = await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity: newQuantity }
    });
  } else {
    if (Number(quantity) > MAX_QUANTITY) {
      throw new AppError(`Maximum quantity per item is ${MAX_QUANTITY}`, 400);
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
};

export const updateQuantity = async (itemId, quantity) => {
  const cartItem = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!cartItem) throw new AppError('Cart item not found', 404);

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return null;
  }

  if (quantity > MAX_QUANTITY) {
    throw new AppError(`Maximum quantity per item is ${MAX_QUANTITY}`, 400);
  }

  return await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity }
  });
};

export const removeItem = async (itemId) => {
  const cartItem = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (cartItem) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  }
  return { success: true };
};

export const clearCart = async (userId) => {
  const customer = await prisma.customer.findUnique({ where: { user_id: userId } });
  if (!customer) throw new AppError('Customer not found', 404);

  const cart = await prisma.cart.findUnique({ where: { customer_id: customer.id } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cart_id: cart.id } });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { restaurant_id: null }
    });
  }

  return { success: true };
};
