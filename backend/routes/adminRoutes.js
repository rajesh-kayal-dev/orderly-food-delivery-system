import express from 'express';
const router = express.Router();
import { getSystemStats,
	getAllUsers,
	getAllOrders,
	updateUserStatus,
	getPendingApprovals,
	getPendingApprovalDetails,
	approvePendingApproval,
	rejectPendingApproval } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.get('/orders', getAllOrders);
router.get('/pending-approvals', getPendingApprovals);
router.get('/pending-approvals/:id', getPendingApprovalDetails);
router.patch('/pending-approvals/:id/approve', approvePendingApproval);
router.patch('/pending-approvals/:id/reject', rejectPendingApproval);

export default router;
