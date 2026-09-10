const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserAccount = require('../states/account/UserAccount');

class AuthService {
  generateToken(user) {
    const fs = require('fs');
    const path = require('path');
    const privateKey = fs.readFileSync(path.join(__dirname, '../certs/private.key'));

    return jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        email: user.email,
        full_name: user.full_name
      }, 
      privateKey, 
      { 
        algorithm: 'RS256',
        expiresIn: '30d' 
      }
    );
  }

  async resolveProfile(user) {
    if (user.Customer) return user.Customer;
    if (user.DeliveryPartner) return user.DeliveryPartner;
    if (user.Admin) return user.Admin;
    if (user.CustomerSupport) return user.CustomerSupport;
    return null;
  }

  toUserAccount(user) {
    return new UserAccount(user);
  }

  async getManagedUser(userId, options = {}) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      ...options
    });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async register(userData) {
    const { email, password, role, full_name, phone_number, name, department, contact_number, vehicle_license } = userData;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      throw new Error('User already exists');
    }

    const requiresApproval = role === 'restaurant' || role === 'delivery_partner';
    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        role,
        full_name,
        phone_number,
        is_active: !requiresApproval
      }
    });

    let profile = null;
    switch (role) {
      case 'customer':
        profile = await prisma.customer.create({ data: { user_id: user.id } });
        break;
      case 'restaurant':
        profile = null;
        break;
      case 'delivery_partner':
        profile = await prisma.deliveryPartner.create({ data: { user_id: user.id, vehicle_license } });
        break;
      case 'admin':
        profile = await prisma.admin.create({ data: { user_id: user.id, department } });
        break;
      case 'customer_support':
        profile = await prisma.customerSupport.create({ data: { user_id: user.id, contact_number: phone_number || contact_number } });
        break;
    }

    const account = this.toUserAccount(user);

    return {
      user,
      profile,
      token: this.generateToken(user),
      accountState: account.getStateName()
    };
  }

  async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        Customer: { include: { addresses: true } },
        DeliveryPartner: true,
        Admin: true,
        CustomerSupport: true
      }
    });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new Error('Invalid email or password');
    }

    const account = this.toUserAccount(user);
    account.login();

    return {
      user,
      profile: await this.resolveProfile(user),
      token: this.generateToken(user),
      accountState: account.getStateName()
    };
  }

  async activateAccount(userId) {
    const user = await this.getManagedUser(userId);
    const account = this.toUserAccount(user);
    account.changeState('activate');
    await account.persist(prisma);

    return {
      id: user.id,
      is_active: user.is_active,
      state: account.getStateName()
    };
  }

  async suspendAccount(userId, { currentAdminId } = {}) {
    if (userId === currentAdminId) {
      throw new Error('Cannot deactivate your own admin account');
    }

    const user = await this.getManagedUser(userId);
    const account = this.toUserAccount(user);
    account.changeState('suspend');
    await account.persist(prisma);

    return {
      id: user.id,
      is_active: user.is_active,
      state: account.getStateName()
    };
  }

  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Customer: { include: { addresses: true } },
        DeliveryPartner: true,
        Admin: true,
        CustomerSupport: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    delete user.password_hash;
    return user;
  }

  async updateProfile(userId, updateData, io) {
    const { full_name, phone_number, password, vehicle_license, address } = updateData;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const updateFields = {};
    if (full_name) updateFields.full_name = full_name;
    if (phone_number) updateFields.phone_number = phone_number;
    if (password) updateFields.password_hash = await bcrypt.hash(password, 10);

    if (Object.keys(updateFields).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateFields
      });
    }

    if (user.role === 'delivery_partner') {
      const driver = await prisma.deliveryPartner.findUnique({ where: { user_id: user.id } });
      if (driver && vehicle_license) {
        await prisma.deliveryPartner.update({
          where: { id: driver.id },
          data: { vehicle_license }
        });
      }
    } else if (user.role === 'customer' && address) {
      const customer = await prisma.customer.findUnique({ where: { user_id: user.id } });
      if (customer) {
        const customerAddress = await prisma.address.findFirst({
          where: { customer_id: customer.id },
          orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }]
        });

        if (customerAddress) {
          await prisma.address.updateMany({
            where: { customer_id: customer.id },
            data: { is_default: false }
          });

          await prisma.address.update({
            where: { id: customerAddress.id },
            data: { street: address, is_default: true }
          });
        } else {
          await prisma.address.create({
            data: {
              customer_id: customer.id,
              street: address,
              city: 'Food City',
              is_default: true
            }
          });
        }
      }
    }

    return await this.getProfile(user.id);
  }
}

module.exports = new AuthService();
