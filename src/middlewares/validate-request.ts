import { NextFunction, Request, Response } from 'express';
import { matchedData, validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../lib/api-response';

export function validateRequest(req: Request, res: Response, next: NextFunction) {
	const result = validationResult(req);

	if (!result.isEmpty()) {
		return ApiResponse.fail(
			res,
			'Request validation failed',
			null,
			StatusCodes.UNPROCESSABLE_ENTITY,
			result.array() as unknown as Gextra
		);
	}

	req.body = matchedData(req, {
		locations: ['body'],
		includeOptionals: true,
	});

	return next();
}
