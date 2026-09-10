import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import UserAccount from '../states/account/UserAccount.js';
import { signToken } from './tokenService.js';
import { AppError } from '../middleware/errorHandler.js';

export const generateTokenResponse = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name
  };

  const token = signToken(payload);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone_number: user.phone_number
    }
  };
};

export const register = async (userData) => {
  const { email, password, full_name, role = 'customer', phone_number } = userData;

  if (!email || !password || !full_name) {
    throw new AppError('Email, password, and full name are required', 400);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email is already registered', 400);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const isAutoActive = role === 'customer' || role === 'admin' || role === 'customer_support';

  const newUser = await prisma.user.create({
    data: {
      email,
      password_hash,
      full_name,
      phone_number,
      role,
      is_active: isAutoActive
    }
  });

  let profile = null;
  if (newUser.role === 'customer') {
    profile = await prisma.customer.create({ data: { user_id: newUser.id } });
  } else if (newUser.role === 'restaurant') {
    profile = await prisma.restaurant.create({
      data: {
        user_id: newUser.id,
        name: `${full_name}'s Restaurant`
      }
    });
  } else if (newUser.role === 'delivery_partner') {
    profile = await prisma.deliveryPartner.create({ data: { user_id: newUser.id } });
  }

  const tokenData = generateTokenResponse(newUser);
  const account = new UserAccount(newUser);

  return {
    ...tokenData,
    accountState: account.getStateName(),
    profile
  };
};

export const login = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const account = new UserAccount(user);
  account.login();

  let profile = null;
  if (user.role === 'customer') {
    profile = await prisma.customer.findUnique({ where: { user_id: user.id } });
  } else if (user.role === 'restaurant') {
    profile = await prisma.restaurant.findUnique({ where: { user_id: user.id } });
  } else if (user.role === 'delivery_partner') {
    profile = await prisma.deliveryPartner.findUnique({ where: { user_id: user.id } });
  }

  const tokenData = generateTokenResponse(user);

  return {
    ...tokenData,
    accountState: account.getStateName(),
    profile
  };
};

export const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      full_name: true,
      phone_number: true,
      role: true,
      is_active: true,
      created_at: true,
      customer: true,
      restaurant: true,
      deliveryPartner: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

export const updateProfile = async (userId, updateData) => {
  const { full_name, phone_number, password, restaurant_name, location, cuisine_type, vehicle_license } = updateData;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updateFields = {};
  if (full_name) updateFields.full_name = full_name;
  if (phone_number) updateFields.phone_number = phone_number;
  if (password) updateFields.password_hash = await bcrypt.hash(password, 10);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateFields,
    select: {
      id: true,
      email: true,
      full_name: true,
      phone_number: true,
      role: true,
      is_active: true,
      updated_at: true
    }
  });

  if (user.role === 'restaurant' && (restaurant_name || location || cuisine_type)) {
    await prisma.restaurant.updateMany({
      where: { user_id: userId },
      data: {
        ...(restaurant_name ? { name: restaurant_name } : {}),
        ...(location ? { address: location } : {})
      }
    });
  }

  if (user.role === 'delivery_partner' && vehicle_license) {
    await prisma.deliveryPartner.updateMany({
      where: { user_id: userId },
      data: { vehicle_number: vehicle_license }
    });
  }

  return updatedUser;
};

export const activateAccount = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const account = new UserAccount(user);
  account.changeState('activate');
  await account.persist(prisma);

  return { id: user.id, is_active: true, state: account.getStateName() };
};

export const suspendAccount = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const account = new UserAccount(user);
  account.changeState('suspend');
  await account.persist(prisma);

  return { id: user.id, is_active: false, state: account.getStateName() };
};
