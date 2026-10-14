import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../../../lib/api-response';
import * as service from './auth.service';
import { validateLogin, validateRefreshToken, validateRegister } from './auth.validation';

export async function register(req: Request, res: Response, next: NextFunction) {
	try {
		const user = await service.register(validateRegister(req.body));
		return ApiResponse.success(res, 'User created successfully', user, StatusCodes.CREATED);
	} catch (error) {
		return next(error);
	}
}

export async function login(req: Request, res: Response, next: NextFunction) {
	try {
		const result = await service.login(validateLogin(req.body));
		return ApiResponse.success(res, 'Login successful', result, StatusCodes.OK);
	} catch (error) {
		return next(error);
	}
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
	try {
		const result = await service.refresh(validateRefreshToken(req.body));
		return ApiResponse.success(res, 'Token refreshed successfully', result, StatusCodes.OK);
	} catch (error) {
		return next(error);
	}
}

export async function logout(req: Request, res: Response, next: NextFunction) {
	try {
		await service.logout(validateRefreshToken(req.body));
		return ApiResponse.success(res, 'Logout successful', null, StatusCodes.OK);
	} catch (error) {
		return next(error);
	}
}
