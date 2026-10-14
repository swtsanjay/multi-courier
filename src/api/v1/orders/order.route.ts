import { Router } from 'express';
import { authenticate } from '../../../middlewares/authenticate';
import { validateRequest } from '../../../middlewares/validate-request';
import { create, index, show } from './order.controller';
import { createOrderValidation, listOrdersValidation, orderIdValidation } from './order.validation';

const router = Router();
router.use(authenticate);
router.post('/', createOrderValidation, validateRequest, create);
router.get('/', listOrdersValidation, validateRequest, index);
router.get('/:orderId', orderIdValidation, validateRequest, show);
export default router;
