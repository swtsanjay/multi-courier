import { Router } from 'express';
import { authenticate } from '../../../middlewares/authenticate';
import { index } from './courier.controller';

const router = Router();

router.get('/', authenticate, index);

export default router;
