import cartService from '../services/cartService.js';

export const getCart = async (req, res) => {
    try {
        const cart = await cartService.getCart(req.user.id);
        res.json({ success: true, data: cart });
    } catch (error) {
        console.error(error);
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

export const addItemToCart = async (req, res) => {
    try {
        await cartService.addItem(req.user.id, req.body);
        res.json({ success: true, message: 'Item added to cart' });
    } catch (error) {
        console.error(error);
        const statusCode =
            error.message.includes('not found') ? 404 :
            error.type === 'RESTAURANT_CLOSED' ? 400 :
            400;
        res.status(statusCode).json({ success: false, message: error.message, type: error.type });
    }
};

export const updateItemQuantity = async (req, res) => {
    try {
        const { quantity } = req.body;
        await cartService.updateQuantity(req.params.itemId, quantity);
        res.json({ success: true, message: 'Quantity updated' });
    } catch (error) {
        console.error(error);
        const statusCode = error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

export const removeItem = async (req, res) => {
    try {
        await cartService.removeItem(req.params.itemId);
        res.json({ success: true, message: 'Item removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const clearCart = async (req, res) => {
    try {
        await cartService.clearCart(req.user.id);
        res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
