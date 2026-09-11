import { DeliveryPartner, User } from '../models.js';

/**
 * GET /api/delivery-partner/my-profile
 * Returns the currently authenticated delivery partner's profile.
 */
export const getMyProfile = async (req, res) => {
    try {
        const driver = await DeliveryPartner.findOne({
            where: { user_id: req.user.id },
            include: [{ model: User, attributes: ['id', 'full_name', 'email', 'phone_number', 'role'] }]
        });

        if (!driver) {
            return res.status(404).json({ success: false, message: 'Delivery partner profile not found' });
        }

        res.json({ success: true, data: driver });
    } catch (error) {
        console.error('getMyProfile error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * PUT /api/delivery-partner/my-profile
 * Updates the authenticated delivery partner's profile fields.
 * Commonly used to toggle is_available (online/offline status).
 */
export const updateMyProfile = async (req, res) => {
    try {
        const driver = await DeliveryPartner.findOne({ where: { user_id: req.user.id } });

        if (!driver) {
            return res.status(404).json({ success: false, message: 'Delivery partner profile not found' });
        }

        const allowedFields = [
            'is_available',
            'vehicle_license',
            'vehicle_type',
            'vehicle_name',
            'address',
            'operating_zone',
            'delivery_category'
        ];

        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        await driver.update(updates);

        // Re-fetch to return fresh data
        const updatedDriver = await DeliveryPartner.findOne({
            where: { user_id: req.user.id },
            include: [{ model: User, attributes: ['id', 'full_name', 'email', 'phone_number', 'role'] }]
        });

        res.json({ success: true, data: updatedDriver });
    } catch (error) {
        console.error('updateMyProfile error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
