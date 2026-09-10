import env from '../config/env.js';
import * as authService from '../services/authService.js';

export const registerUser = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json({
      success: true,
      data: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        full_name: result.user.full_name,
        phone_number: result.user.phone_number,
        token: result.token,
        account_state: result.accountState,
        profile: result.profile
      }
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return res.json({
      success: true,
      data: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        full_name: result.user.full_name,
        phone_number: result.user.phone_number,
        token: result.token,
        account_state: result.accountState,
        profile: result.profile
      }
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuthRedirect = async (req, res, next) => {
  try {
    const url = authService.getGoogleAuthUrl();
    if (req.query.json === 'true' || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, data: { url } });
    }
    return res.redirect(url);
  } catch (error) {
    next(error);
  }
};

export const googleAuthCallback = async (req, res, next) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${env.frontendUrl}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${env.frontendUrl}/login?error=missing_authorization_code`);
  }

  try {
    const result = await authService.handleGoogleCallback(code);
    const serializedData = encodeURIComponent(JSON.stringify(result));
    return res.redirect(`${env.frontendUrl}/auth/callback?token=${result.token}&data=${serializedData}`);
  } catch (err) {
    return res.redirect(`${env.frontendUrl}/login?error=${encodeURIComponent(err.message || 'Google authentication failed')}`);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const result = await authService.googleDirectLogin(req.body);
    return res.json({
      success: true,
      data: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        full_name: result.user.full_name,
        phone_number: result.user.phone_number,
        token: result.token,
        account_state: result.accountState,
        profile: result.profile
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    return res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await authService.updateProfile(req.user.id, req.body);
    return res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};
