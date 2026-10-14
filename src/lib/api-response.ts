import { Response as ExpressResponse } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from './../config';
import Logger from './Logger';

function requestValue(value: unknown): string | undefined {
	if (typeof value === 'string' || typeof value === 'number') return String(value);
	return undefined;
}

function requestMetadata(res: ExpressResponse, error?: GError) {
	const body = res.req.body;
	const firstOrder = Array.isArray(body) ? body[0] : body;
	const orderId = requestValue(firstOrder?.order_id)
		?? requestValue(res.req.params?.orderId);
	const courierPartner = requestValue(firstOrder?.courier_partner);

	return {
		requestId: res.req.requestId,
		orderId,
		courierPartner,
		method: res.req.method,
		path: res.req.originalUrl,
		errorType: error?.name ?? 'RequestError',
		stack: error?.stack,
	};
}
export default class Response {
	static success<T>(
		res: ExpressResponse,
		message: string | GResponse<T>,
		data?: T | null,
		code?: StatusCodes,
		extra?: Gextra,
		qdata?: Partial<GPagination & GQueryParams>
	): GResponse<T> {
		const resObj: GResponse<T> = {
			success: true,
			message: '',
			code: StatusCodes.OK,
			data: null as T,
			extra: null,
			qdata: {},
			request_id: res.req.requestId,
		};

		if (typeof message === 'string') {
			resObj.message = message;
			resObj.data = (data ?? null) as T;
			resObj.code = code || StatusCodes.OK;
			resObj.extra = extra || null;
			resObj.qdata = qdata;
		} else {
			resObj.message = message.message || 'success';
			resObj.data = (message.data ?? null) as T;
			resObj.code = message.code || StatusCodes.OK;
			resObj.success = message.success;
			resObj.extra = message.extra || null;
			resObj.qdata = message.qdata;
		}

		if (res.req.headers.json) {
			res
				.status(resObj.code)
				.type('json')
				.send(`${JSON.stringify(resObj, null, 2)}\n`);
		} else {
			res.status(resObj.code).json(resObj);
		}
		return resObj;
	}

	static fail<T>(
		res: ExpressResponse,
		message: string | GError | GResponse<T>,
		data?: T | null,
		code?: StatusCodes,
		extra?: Gextra
	): GResponse<T> {
		const sourceError = typeof message === 'string' || 'success' in message
			? undefined
			: message;
		Logger.error(
			typeof message === 'string' ? message : message.message,
			requestMetadata(res, sourceError)
		);
		const resObj: GResponse<T> = {
			success: false,
			message: '',
			code: StatusCodes.INTERNAL_SERVER_ERROR,
			data: null as T,
			extra: null,
			request_id: res.req.requestId,
		};

		if (typeof message === 'string') {
			resObj.message = message;
			resObj.data = (data ?? null) as T;
			resObj.code = code || StatusCodes.INTERNAL_SERVER_ERROR;
			resObj.extra = extra;
		} else if ('success' in message) {
			resObj.message = message.message || 'fail';
			resObj.data = (data ?? null) as T;
			resObj.code = message.code || StatusCodes.INTERNAL_SERVER_ERROR;
			resObj.extra = message.extra || null;
		} else {
			resObj.message = message.message || 'fail';
			resObj.data = (data ?? null) as T;
			resObj.code = message.code || StatusCodes.INTERNAL_SERVER_ERROR;
			resObj.extra = message.extra || null;
		}

		if (res.req.headers.json) {
			res
				.status(resObj.code)
				.type('json')
				.send(`${JSON.stringify(resObj, null, 2)}\n`);
		} else {
			res.status(resObj.code).json(resObj);
		}
		return resObj;
	}
	static createError(
		customErr: GError,
		systemError: GError | Error | null = null
	): GError {
		const message = config.IsLocal && systemError
			? systemError.message
			: customErr.message;

		const error = new Error(message) as GError;
		error.code = customErr.code || StatusCodes.UNPROCESSABLE_ENTITY;
		error.name = customErr.name || 'CustomError';
		error.data = customErr.data || null;
		error.extra = customErr.extra || null;

		return error;
	}
}
