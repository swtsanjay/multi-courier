import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import config from '../config';
import ApiResponse from '../lib/api-response';
import { prisma } from '../lib/prisma';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
	try {
		const authorization = req.headers.authorization;
		if (!authorization?.startsWith('Bearer ')) {
			return ApiResponse.fail(res, 'Authentication is required', null, StatusCodes.UNAUTHORIZED);
		}

		const token = authorization.slice(7);
		const payload = jwt.verify(token, config.jwt.secretKey) as JwtPayload;
		const userId = Number(payload.sub);
		const user = await prisma.user.findFirst({
			where: { id: userId, isActive: true, deletedAt: null },
			select: { id: true, email: true, name: true },
		});

		if (!user) {
			return ApiResponse.fail(res, 'Authentication is required', null, StatusCodes.UNAUTHORIZED);
		}

		req.user = user;
		return next();
	} catch {
		return ApiResponse.fail(res, 'Access token is invalid or expired', null, StatusCodes.UNAUTHORIZED);
	}
}
