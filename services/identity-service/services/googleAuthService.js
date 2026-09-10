import env from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

const getClientId = () => process.env.GOOGLE_CLIENT_ID || env.google.clientId;
const getClientSecret = () => process.env.GOOGLE_CLIENT_SECRET || env.google.clientSecret;
const getCallbackUrl = () => process.env.GOOGLE_CALLBACK_URL || env.google.callbackUrl;

export const getGoogleAuthUrl = () => {
  const clientId = getClientId();
  const callbackUrl = getCallbackUrl();

  if (!clientId) {
    throw new AppError('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in .env', 503);
  }

  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: callbackUrl,
    client_id: clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' ')
  };

  const qs = new URLSearchParams(options).toString();
  return `${rootUrl}?${qs}`;
};

export const exchangeGoogleCodeForTokens = async (code) => {
  const clientId = getClientId();
  const clientSecret = getClientSecret();
  const callbackUrl = getCallbackUrl();

  if (!clientId || !clientSecret) {
    throw new AppError('Google OAuth credentials not configured on server', 503);
  }

  const url = 'https://oauth2.googleapis.com/token';
  const values = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: callbackUrl,
    grant_type: 'authorization_code'
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(values)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new AppError(`Google token exchange failed: ${data.error_description || data.error || 'Invalid code'}`, 400);
  }

  return data;
};

export const fetchGoogleUserInfo = async (accessToken) => {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new AppError('Failed to retrieve user profile from Google', 400);
  }

  return await res.json();
};

export const verifyGoogleIdToken = async (idToken) => {
  if (!idToken) {
    throw new AppError('Google ID token is required', 400);
  }

  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new AppError(`Invalid Google ID token: ${data.error_description || data.error || 'Verification failed'}`, 401);
  }

  if (env.google.clientId && data.aud !== env.google.clientId) {
    throw new AppError('Google ID token audience mismatch', 401);
  }

  return {
    email: data.email,
    name: data.name || data.given_name || 'Google User',
    sub: data.sub,
    picture: data.picture,
    email_verified: data.email_verified === 'true' || data.email_verified === true
  };
};
