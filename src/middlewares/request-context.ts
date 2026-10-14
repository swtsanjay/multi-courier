import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

const validRequestId = /^[A-Za-z0-9._-]{1,128}$/;

export function requestContext(req: Request, res: Response, next: NextFunction) {
	const suppliedRequestId = req.header('x-request-id');
	const requestId = suppliedRequestId && validRequestId.test(suppliedRequestId)
		? suppliedRequestId
		: randomUUID();

	req.requestId = requestId;
	res.setHeader('x-request-id', requestId);
	next();
}
