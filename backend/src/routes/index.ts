import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import sessionRoutes from './session.routes';
import supervisionRoutes from './supervision.routes';
import reportRoutes from './report.routes';
import subscriptionRoutes from './subscription.routes';
import tokenRoutes from './token.routes';
import feedbackRoutes from './feedback.routes';
import adminRoutes from './admin.routes';
import appConfigRoutes from './appConfig.routes';
import userManagerRoutes from './userManager.routes';

const router = Router();

router.use('/config', appConfigRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/sessions', sessionRoutes);
router.use('/supervision', supervisionRoutes);
router.use('/reports', reportRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/token', tokenRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/user-manager', userManagerRoutes);

export default router;
