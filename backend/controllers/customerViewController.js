import customerAppFacade from '../facades/customerAppFacade.js';

/**
 * CustomerViewController
 *
 * Thin UI-facing controller for the Customer Web/App subsystem.
 */
export const login = (req, res) => customerAppFacade.authenticateUser(req, res);
export const browseCatalog = (req, res) => customerAppFacade.browseCatalog(req, res);
export const searchCatalog = (req, res) => customerAppFacade.searchCatalog(req, res);
export const getProductDetail = (req, res) => customerAppFacade.getProductDetail(req, res);
export const getCart = (req, res) => customerAppFacade.getCart(req, res);
export const addToCart = (req, res) => customerAppFacade.addToCart(req, res);
export const updateCartItem = (req, res) => customerAppFacade.updateCartItem(req, res);
export const removeCartItem = (req, res) => customerAppFacade.removeCartItem(req, res);
export const clearCart = (req, res) => customerAppFacade.clearCart(req, res);
export const checkout = (req, res) => customerAppFacade.checkout(req, res);
export const trackOrders = (req, res) => customerAppFacade.trackOrders(req, res);
export const getMonthlyFavorite = (req, res) => customerAppFacade.getMonthlyFavorite(req, res);
