import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../../../lib/api-response';
import { createOrder } from './order.service';
import { CreateOrderInput } from './order.validation';

export async function create(req: Request, res: Response, next: NextFunction) {
	try {
		const input = req.body as CreateOrderInput;
		const result = await createOrder(req.user!.id, input);
		const status = result.replayed ? StatusCodes.OK : StatusCodes.CREATED;
		return ApiResponse.success(res, result.replayed ? 'Order already exists' : 'Order created successfully', result, status);
	} catch (error) {
		if (error instanceof Error && !('code' in error)) {
			return ApiResponse.fail(res, error.message, null, StatusCodes.BAD_REQUEST);
		}
		return next(error);
	}
}
