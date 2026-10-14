import { Router } from 'express';
import { authenticate } from '../../../middlewares/authenticate';
import { validateRequest } from '../../../middlewares/validate-request';
import { create } from './order.controller';
import { createOrderValidation } from './order.validation';

const router = Router();
router.post('/', authenticate, createOrderValidation, validateRequest, create);
export default router;
