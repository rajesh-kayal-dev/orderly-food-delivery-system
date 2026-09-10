import prisma from '../config/prisma.js';

export { prisma };
export const User = prisma.user;
export const Customer = prisma.customer;
export const Restaurant = prisma.restaurant;
export const DeliveryPartner = prisma.deliveryPartner;
export const Address = prisma.address;
export const MenuItem = prisma.menuItem;
export const MenuCategory = prisma.menuCategory;
export const Cart = prisma.cart;
export const CartItem = prisma.cartItem;
export const Order = prisma.order;
export const OrderItem = prisma.orderItem;
export const Notification = prisma.notification;

export default prisma;
