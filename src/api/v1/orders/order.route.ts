import { Router } from 'express';
import { authenticate } from '../../../middlewares/authenticate';
import { validateRequest } from '../../../middlewares/validate-request';
import { cancel, create, index, show, track } from './order.controller';
import { createOrderValidation, listOrdersValidation, orderIdValidation } from './order.validation';

const router = Router();
router.use(authenticate);
router.post('/', createOrderValidation, validateRequest, create);
router.get('/', listOrdersValidation, validateRequest, index);
router.get('/:orderId/track', orderIdValidation, validateRequest, track);
router.post('/:orderId/cancel', orderIdValidation, validateRequest, cancel);
router.get('/:orderId', orderIdValidation, validateRequest, show);
export default router;
