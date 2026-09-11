export const UserRoles = {
  CUSTOMER: 'customer',
  RESTAURANT: 'restaurant',
  DELIVERY_PARTNER: 'delivery_partner',
  ADMIN: 'admin',
  CUSTOMER_SUPPORT: 'customer_support'
};

export const OrderStatuses = {
  PLACED: 'placed',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const SocketEvents = {
  NEW_ORDER: 'NEW_ORDER',
  ORDER_STATUS_UPDATED: 'ORDER_STATUS_UPDATED',
  ORDER_ACCEPTED: 'ORDER_ACCEPTED',
  ORDER_READY_FOR_PICKUP: 'ORDER_READY_FOR_PICKUP',
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
  RESTAURANT_STATUS_UPDATED: 'RESTAURANT_STATUS_UPDATED',
  DRIVER_UPDATE_LOCATION: 'DRIVER_UPDATE_LOCATION',
  DRIVER_LOCATION_UPDATED: 'DRIVER_LOCATION_UPDATED'
};

export const createApiResponse = (success, data = null, message = null) => ({
  success,
  ...(data !== null && { data }),
  ...(message !== null && { message })
});
