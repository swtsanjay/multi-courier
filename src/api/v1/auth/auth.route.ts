import { Router } from 'express';
import * as controller from './auth.controller';
import { validateRequest } from '../../../middlewares/validate-request';
import { loginValidation, refreshTokenValidation, registerValidation } from './auth.validation';

const router = Router();

router.post('/register', registerValidation, validateRequest, controller.register);
router.post('/login', loginValidation, validateRequest, controller.login);
router.post('/refresh-token', refreshTokenValidation, validateRequest, controller.refreshToken);
router.post('/logout', refreshTokenValidation, validateRequest, controller.logout);

export default router;
