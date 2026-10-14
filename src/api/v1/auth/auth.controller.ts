import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../../../lib/api-response';
import * as service from './auth.service';
import { LoginInput, RegisterInput } from './auth.types';

export async function register(req: Request, res: Response, next: NextFunction) {
	try {
		const user = await service.register(req.validated!.body as RegisterInput);
		return ApiResponse.success(res, 'User created successfully', user, StatusCodes.CREATED);
	} catch (error) {
		return next(error);
	}
}

export async function login(req: Request, res: Response, next: NextFunction) {
	try {
		const result = await service.login(req.validated!.body as LoginInput);
		return ApiResponse.success(res, 'Login successful', result, StatusCodes.OK);
	} catch (error) {
		return next(error);
	}
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
	try {
		const refreshToken = String(req.validated!.body.refresh_token);
		const result = await service.refresh(refreshToken);
		return ApiResponse.success(res, 'Token refreshed successfully', result, StatusCodes.OK);
	} catch (error) {
		return next(error);
	}
}

export async function logout(req: Request, res: Response, next: NextFunction) {
	try {
		const refreshToken = String(req.validated!.body.refresh_token);
		await service.logout(refreshToken);
		return ApiResponse.success(res, 'Logout successful', null, StatusCodes.OK);
	} catch (error) {
		return next(error);
	}
}
