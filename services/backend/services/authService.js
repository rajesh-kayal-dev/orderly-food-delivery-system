import { User, DeliveryPartner, Restaurant, Customer, Address, Admin, CustomerSupport } from '../models.js';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';

class AuthService {
  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '30d'
    });
  }

  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Customer },
        { model: Restaurant },
        { model: DeliveryPartner },
        { model: Admin },
        { model: CustomerSupport }
      ]
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateProfile(userId, updateData, io) {
    const { 
      full_name, phone_number, password, 
      restaurant_name, location, cuisine_type, 
      vehicle_license, vehicle_type, vehicle_name, operating_zone, delivery_category,
      address, is_open 
    } = updateData;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (full_name) user.full_name = full_name;
    if (phone_number) user.phone_number = phone_number;
    if (password) user.password_hash = password;

    await user.save();

    if (user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ where: { user_id: user.id } });
      if (restaurant) {
        const wasOpen = restaurant.is_open;
        if (restaurant_name) restaurant.name = restaurant_name;
        if (location) restaurant.location = location;
        if (cuisine_type) restaurant.cuisine_type = cuisine_type;
        if (typeof is_open === 'boolean') restaurant.is_open = is_open;
        await restaurant.save();

        if (io && wasOpen !== restaurant.is_open) {
          io.emit('RESTAURANT_STATUS_UPDATED', {
            restaurantId: restaurant.id,
            name: restaurant.name,
            is_open: restaurant.is_open
          });
        }
      }
    } else if (user.role === 'delivery_partner') {
      const driver = await DeliveryPartner.findOne({ where: { user_id: user.id } });
      if (driver) {
        if (vehicle_license) driver.vehicle_license = vehicle_license;
        if (vehicle_type) driver.vehicle_type = vehicle_type;
        if (vehicle_name) driver.vehicle_name = vehicle_name;
        if (address) driver.address = address;
        if (operating_zone) driver.operating_zone = operating_zone;
        if (delivery_category) driver.delivery_category = delivery_category;
        await driver.save();
      }
    }

    return await this.getProfile(user.id);
  }

  async getApprovedDeliveryPartners() {
    try {
      const users = await User.findAll({
        where: {
          role: 'delivery_partner',
          is_active: true
        },
        include: [{ model: DeliveryPartner }]
      });

      if (!users || users.length === 0) {
        return [];
      }

      const sampleAvatars = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400'
      ];

      return users.map((user, idx) => {
        const dp = user.DeliveryPartner || user.deliveryPartner || {};
        
        // Determine online status strictly based on dp.is_available or dp.status
        let isOnline = false;
        if (dp.is_available !== undefined && dp.is_available !== null) {
          isOnline = Boolean(dp.is_available);
        } else if (dp.status) {
          isOnline = (dp.status === 'available' || dp.status === 'Online');
        }

        return {
          id: user.id,
          name: user.full_name || 'Delivery Partner',
          status: isOnline ? 'Online' : 'Offline',
          is_online: isOnline,
          is_available: isOnline,
          rating: dp.rating || 4.9,
          reviewsCount: 150 + (idx * 25),
          area: dp.operating_zone || 'Salt Lake',
          city: 'Kolkata',
          deliveries: `${600 + (idx * 140)}+`,
          avatar: sampleAvatars[idx % sampleAvatars.length],
          vehicle: `${dp.vehicle_type || 'Scooter'} (${dp.vehicle_license || dp.vehicle_number || 'WB-02-AK-9821'})`,
          joinDate: 'Jan 2024',
          phone: user.phone_number || '+91 98301 23456'
        };
      });
    } catch (error) {
      console.error('Error fetching approved delivery partners:', error);
      return [];
    }
  }
}

export default new AuthService();
