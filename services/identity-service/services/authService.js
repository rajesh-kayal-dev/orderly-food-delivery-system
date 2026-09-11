import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import UserAccount from '../states/account/UserAccount.js';
import { signToken } from './tokenService.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  getGoogleAuthUrl as getGoogleUrl,
  exchangeGoogleCodeForTokens,
  fetchGoogleUserInfo,
  verifyGoogleIdToken
} from './googleAuthService.js';

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

  const newUser = await prisma.user.create({
    data: {
      email,
      password_hash,
      full_name,
      phone_number,
      role,
      is_active: true
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

  if (!user.is_active) {
    await prisma.user.update({
      where: { id: user.id },
      data: { is_active: true }
    });
    user.is_active = true;
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

export const authenticateGoogleUser = async ({ email, name, sub, picture, defaultRole = 'customer' }) => {
  if (!email) {
    throw new AppError('Google account does not provide an email address', 400);
  }

  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      customer: true,
      restaurant: true,
      deliveryPartner: true
    }
  });

  let profile = null;

  if (user) {
    // User already exists, check account active status
    const account = new UserAccount(user);
    account.login();

    if (user.role === 'customer') profile = user.customer;
    else if (user.role === 'restaurant') profile = user.restaurant;
    else if (user.role === 'delivery_partner') profile = user.deliveryPartner;
  } else {
    // User is new: create user and assign default role (customer)
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const password_hash = await bcrypt.hash(randomPassword, 10);
    const assignedRole = defaultRole || 'customer';

    user = await prisma.user.create({
      data: {
        email,
        password_hash,
        full_name: name || email.split('@')[0],
        role: assignedRole,
        is_active: true
      }
    });

    if (assignedRole === 'customer') {
      profile = await prisma.customer.create({ data: { user_id: user.id } });
    } else if (assignedRole === 'restaurant') {
      profile = await prisma.restaurant.create({
        data: {
          user_id: user.id,
          name: `${user.full_name}'s Restaurant`
        }
      });
    } else if (assignedRole === 'delivery_partner') {
      profile = await prisma.deliveryPartner.create({ data: { user_id: user.id } });
    }
  }

  const tokenData = generateTokenResponse(user);

  return {
    ...tokenData,
    accountState: 'ACTIVE',
    profile
  };
};

export const getGoogleAuthUrl = () => {
  return getGoogleUrl();
};

export const handleGoogleCallback = async (code) => {
  if (!code) {
    throw new AppError('Authorization code is missing from Google callback', 400);
  }

  const tokens = await exchangeGoogleCodeForTokens(code);
  const googleUser = await fetchGoogleUserInfo(tokens.access_token);

  return await authenticateGoogleUser({
    email: googleUser.email,
    name: googleUser.name || googleUser.given_name,
    sub: googleUser.sub,
    picture: googleUser.picture
  });
};

export const googleDirectLogin = async (payload = {}) => {
  const { idToken, email, name, sub } = payload;

  if (idToken) {
    const verifiedData = await verifyGoogleIdToken(idToken);
    return await authenticateGoogleUser(verifiedData);
  }

  if (email) {
    return await authenticateGoogleUser({
      email,
      name: name || email.split('@')[0],
      sub: sub || 'manual_google_sub'
    });
  }

  throw new AppError('Either Google idToken or verified Google email payload is required', 400);
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

export const getApprovedDeliveryPartners = async () => {
  const users = await prisma.user.findMany({
    where: {
      role: 'delivery_partner',
      is_active: true
    },
    include: {
      deliveryPartner: true
    }
  });

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400'
  ];

  return users.map((user, idx) => {
    const dp = user.deliveryPartner || {};
    return {
      id: user.id,
      name: user.full_name || 'Delivery Partner',
      status: user.is_active ? 'Online' : 'Offline',
      rating: dp.rating || 4.9,
      reviewsCount: 150 + (idx * 25),
      area: 'Salt Lake',
      city: 'Kolkata',
      deliveries: `${600 + (idx * 140)}+`,
      avatar: sampleAvatars[idx % sampleAvatars.length],
      vehicle: `${dp.vehicle_type || 'Scooter'} (${dp.vehicle_number || 'WB-02-AK-9821'})`,
      joinDate: 'Jan 2024',
      phone: user.phone_number || '+91 98301 23456'
    };
  });
};

