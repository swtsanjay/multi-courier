import { body } from 'express-validator';

export type RegisterInput = {
	name: string;
	email: string;
	password: string;
	phone?: string | null;
};

export type LoginInput = { email: string; password: string };

const emailRule = body('email')
	.trim()
	.isEmail()
	.withMessage('email must be valid')
	.normalizeEmail();

const passwordRule = body('password')
	.isString()
	.isLength({ min: 8 })
	.withMessage('password must contain at least 8 characters');

export const registerValidation = [
	body('name')
		.trim()
		.notEmpty()
		.withMessage('name is required')
		.isLength({ max: 100 })
		.withMessage('name must not exceed 100 characters'),
	emailRule,
	passwordRule,
	body('phone')
		.optional({ nullable: true, checkFalsy: true })
		.trim()
		.matches(/^\+?[0-9]{7,20}$/)
		.withMessage('phone must contain 7 to 20 digits'),
];

export const loginValidation = [emailRule, passwordRule];

export const refreshTokenValidation = [
	body('refresh_token')
		.trim()
		.notEmpty()
		.withMessage('refresh_token is required'),
];
