const prisma = require('../config/prisma');

module.exports = {
  prisma,
  sequelize: prisma,
  User: prisma.user,
  Customer: prisma.customer,
  Restaurant: prisma.restaurant,
  DeliveryPartner: prisma.deliveryPartner,
  Address: prisma.address,
  MenuItem: prisma.menuItem,
  MenuCategory: prisma.menuCategory,
  Cart: prisma.cart,
  CartItem: prisma.cartItem,
  Order: prisma.order,
  OrderItem: prisma.orderItem,
  Notification: prisma.notification
};
