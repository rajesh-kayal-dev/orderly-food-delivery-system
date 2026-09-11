import { DeliveryPartner, User } from '../models.js';

/**
 * GET /api/delivery-partner/my-profile
 * Returns the currently authenticated delivery partner's profile.
 */
export const getMyProfile = async (req, res) => {
    try {
        let driver = await DeliveryPartner.findOne({
            where: { user_id: req.user.id },
            include: [{ model: User, attributes: ['id', 'full_name', 'email', 'phone_number', 'role'] }]
        });

        if (!driver) {
            driver = await DeliveryPartner.create({
                user_id: req.user.id,
                is_available: true,
                status: 'available',
                vehicle_type: 'Scooter',
                operating_zone: 'Salt Lake'
            });

            driver = await DeliveryPartner.findOne({
                where: { user_id: req.user.id },
                include: [{ model: User, attributes: ['id', 'full_name', 'email', 'phone_number', 'role'] }]
            });
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
        let driver = await DeliveryPartner.findOne({ where: { user_id: req.user.id } });

        if (!driver) {
            driver = await DeliveryPartner.create({
                user_id: req.user.id,
                is_available: req.body.is_available !== undefined ? req.body.is_available : true,
                status: req.body.is_available ? 'available' : 'offline',
                vehicle_type: 'Scooter',
                operating_zone: 'Salt Lake'
            });
        } else {
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

            if (req.body.is_available !== undefined) {
                updates.status = req.body.is_available ? 'available' : 'offline';
            }

            await driver.update(updates);
        }

        const updatedDriver = await DeliveryPartner.findOne({
            where: { user_id: req.user.id },
            include: [{ model: User, attributes: ['id', 'full_name', 'email', 'phone_number', 'role'] }]
        });

        // Real-time socket broadcast
        if (req.io) {
            req.io.emit('DRIVER_STATUS_UPDATED', {
                driverId: updatedDriver ? updatedDriver.id : req.user.id,
                userId: req.user.id,
                is_online: req.body.is_available,
                status: req.body.is_available ? 'Online' : 'Offline'
            });
        }

        res.json({ success: true, data: updatedDriver || { is_available: req.body.is_available } });
    } catch (error) {
        console.error('updateMyProfile error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

