import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';
import UserAccount from '../states/account/UserAccount.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AuthService {
    async register(userData) {
        const { email, password, full_name, role, phone_number } = userData;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('Email is already registered');
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                password_hash,
                full_name,
                phone_number,
                role: role || 'customer'
            }
        });

        if (newUser.role === 'customer') {
            await prisma.customer.create({ data: { user_id: newUser.id } });
        } else if (newUser.role === 'restaurant') {
            await prisma.restaurant.create({
                data: {
                    user_id: newUser.id,
                    name: `${full_name}'s Restaurant`
                }
            });
        } else if (newUser.role === 'delivery_partner') {
            await prisma.deliveryPartner.create({ data: { user_id: newUser.id } });
        }

        return this.generateTokenResponse(newUser);
    }

    async login(email, password) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const account = new UserAccount(user);
        account.login();

        return this.generateTokenResponse(user);
    }

    generateTokenResponse(user) {
        const privateKeyPath = path.join(__dirname, '../certs/private.key');
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name
        };

        const token = jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '7d'
        });

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        };
    }

    async getProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                full_name: true,
                phone_number: true,
                role: true,
                is_active: true,
                created_at: true
            }
        });
        if (!user) throw new Error('User not found');
        return user;
    }
}

export default new AuthService();
