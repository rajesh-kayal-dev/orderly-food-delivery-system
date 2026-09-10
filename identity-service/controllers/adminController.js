import * as adminService from '../services/adminService.js';

export const getSystemStats = async (req, res, next) => {
  try {
    const stats = await adminService.getSystemStats();
    return res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { status } = req.query;
    const users = await adminService.getAllUsers(status);
    return res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;
    const updatedUser = await adminService.updateUserStatus(req.params.id, is_active, req.user.id);
    return res.json({
      success: true,
      data: updatedUser,
      message: 'User status updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingApprovals = async (req, res, next) => {
  try {
    const { type = 'all', search = '', sort = 'newest', page = 1, limit = 9 } = req.query;
    const result = await adminService.getPendingApprovals({ type, search, sort, page, limit });
    return res.json({
      success: true,
      data: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingApprovalDetails = async (req, res, next) => {
  try {
    const result = await adminService.getPendingApprovalById(req.params.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const approvePendingApproval = async (req, res, next) => {
  try {
    const result = await adminService.approvePendingRequest(req.params.id);
    return res.json({
      success: true,
      data: result,
      message: 'Request approved successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const rejectPendingApproval = async (req, res, next) => {
  try {
    const { reason = '' } = req.body;
    const result = await adminService.rejectPendingRequest(req.params.id, reason);
    return res.json({
      success: true,
      data: result,
      message: 'Request rejected successfully'
    });
  } catch (error) {
    next(error);
  }
};
