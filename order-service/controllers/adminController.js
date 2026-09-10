import adminService from '../services/adminService.js';

export const getAllOrders = async (req, res) => {
    try {
        const { restaurantId, status, page, limit, month, year } = req.query;
        const result = await adminService.getAllOrders(restaurantId, status, page, limit, month, year);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
