import * as cartService from '../services/cartService.js';

export const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    return res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

export const addItemToCart = async (req, res, next) => {
  try {
    const item = await cartService.addItem(req.user.id, req.body);
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};
export const addItem = addItemToCart;

export const updateItemQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const item = await cartService.updateQuantity(req.params.itemId || req.params.id, quantity);
    return res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};
export const updateQuantity = updateItemQuantity;

export const removeItem = async (req, res, next) => {
  try {
    await cartService.removeItem(req.params.itemId || req.params.id);
    return res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    await cartService.clearCart(req.user.id);
    return res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};
