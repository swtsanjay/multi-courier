import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../../../lib/api-response';
import { listCouriers } from './courier.service';

export async function index(_req: Request, res: Response, next: NextFunction) {
	try {
		const couriers = await listCouriers();

		return ApiResponse.success(
			res,
			'Couriers fetched successfully',
			{ couriers },
			StatusCodes.OK
		);
	} catch (error) {
		return next(error);
	}
}
