import authController from '../controllers/authController.js';
import catalogController from '../controllers/catalogController.js';
import cartController from '../controllers/cartController.js';
import orderController from '../controllers/orderController.js';

/**
 * CustomerAppFacade
 *
 * CustomerView -> CustomerAppFacade -> AuthController / CatalogController /
 * CartController / OrderController
 */
class CustomerAppFacade {
  authenticateUser(req, res) {
    return authController.loginUser(req, res);
  }

  browseCatalog(req, res) {
    return catalogController.browseCatalog(req, res);
  }

  searchCatalog(req, res) {
    return catalogController.searchCatalog(req, res);
  }

  getProductDetail(req, res) {
    return catalogController.getProductDetail(req, res);
  }

  getCart(req, res) {
    return cartController.getCart(req, res);
  }

  addToCart(req, res) {
    return cartController.addItemToCart(req, res);
  }

  updateCartItem(req, res) {
    return cartController.updateItemQuantity(req, res);
  }

  removeCartItem(req, res) {
    return cartController.removeItem(req, res);
  }

  clearCart(req, res) {
    return cartController.clearCart(req, res);
  }

  checkout(req, res) {
    return orderController.createOrder(req, res);
  }

  trackOrders(req, res) {
    return orderController.getUserOrders(req, res);
  }

  getMonthlyFavorite(req, res) {
    return orderController.getMonthlyFavorite(req, res);
  }
}

export default new CustomerAppFacade();
