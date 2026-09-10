import express from 'express';
import {
    getSystemStats,
    getAllUsers,
    updateUserStatus,
    getPendingApprovals,
    getPendingApprovalDetails,
    approvePendingApproval,
    rejectPendingApproval
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(admin);

router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);

router.get('/pending-approvals', getPendingApprovals);
router.get('/pending-approvals/:id', getPendingApprovalDetails);
router.post('/pending-approvals/:id/approve', approvePendingApproval);
router.post('/pending-approvals/:id/reject', rejectPendingApproval);

export default router;
