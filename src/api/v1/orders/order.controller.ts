import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../../../lib/api-response';
import { createOrder, getOrder, listOrders } from './order.service';
import { CreateOrderInput, ListOrdersInput } from './order.types';

export async function create(req: Request, res: Response, next: NextFunction) {
	try {
		const input = req.validated!.body as CreateOrderInput;
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

export async function index(req: Request, res: Response, next: NextFunction) {
	try {
		const input = {
			page: 1,
			limit: 20,
			...req.validated!.query,
		} as ListOrdersInput;
		const result = await listOrders(req.user!.id, input);

		return ApiResponse.success(res, 'Orders fetched successfully', result, StatusCodes.OK);
	} catch (error) {
		return next(error);
	}
}

export async function show(req: Request, res: Response, next: NextFunction) {
	try {
		const orderId = String(req.validated!.params.orderId);
		const order = await getOrder(req.user!.id, orderId);

		return ApiResponse.success(res, 'Order fetched successfully', { order }, StatusCodes.OK);
	} catch (error) {
		return next(error);
	}
}
