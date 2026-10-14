import { Router } from 'express';
import authRoutes from './auth/auth.route';
import orderRoutes from './orders/order.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/orders', orderRoutes);

export default router;
