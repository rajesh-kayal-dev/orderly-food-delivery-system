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
