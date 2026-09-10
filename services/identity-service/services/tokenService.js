import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import env from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const privateKeyPath = path.join(__dirname, '../certs/private.key');
const publicKeyPath = path.join(__dirname, '../certs/public.key');

let privateKey = null;
let publicKey = null;

try {
  if (fs.existsSync(privateKeyPath)) {
    privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  }
  if (fs.existsSync(publicKeyPath)) {
    publicKey = fs.readFileSync(publicKeyPath, 'utf8');
  }
} catch (error) {
  console.warn('[Identity Service] RSA keys failed to load, fallback to symmetric secret:', error.message);
}

export const signToken = (payload, options = {}) => {
  if (privateKey) {
    return jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn: '7d',
      ...options
    });
  }
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: '7d',
    ...options
  });
};

export const verifyToken = (token) => {
  if (publicKey) {
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  }
  return jwt.verify(token, env.jwtSecret);
};

export const getPublicKey = () => publicKey;
