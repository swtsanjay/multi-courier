import { Router } from 'express';
import { authenticate } from '../../../middlewares/authenticate';
import { validateRequest } from '../../../middlewares/validate-request';
import { cancel, create, index, show, track, createBulk } from './order.controller';
import {createOrderValidation, listOrdersValidation, orderIdValidation, createBulkOrdersValidation } from './order.validation';

const router = Router();
router.use(authenticate);
router.post('/bulk', createBulkOrdersValidation, validateRequest, createBulk);
router.post('/', createOrderValidation, validateRequest, create);
router.get('/', listOrdersValidation, validateRequest, index);
router.get('/:orderId/track', orderIdValidation, validateRequest, track);
router.post('/:orderId/cancel', orderIdValidation, validateRequest, cancel);
router.get('/:orderId', orderIdValidation, validateRequest, show);
export default router;
