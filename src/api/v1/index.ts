import { Router } from 'express';
import authRoutes from './auth/auth.route';
import orderRoutes from './orders/order.route';
import courierRoutes from './couriers/courier.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/orders', orderRoutes);
router.use('/couriers', courierRoutes);

export default router;
