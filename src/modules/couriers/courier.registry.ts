import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../../lib/api-response';
import { CourierAdapter } from './courier.types';
import { MockCourierAdapter } from './mock-courier.adapter';

const adapters = new Map<string, CourierAdapter>();
const mockCourier = new MockCourierAdapter();
adapters.set(mockCourier.code, mockCourier);

export function getCourierAdapter(code: string): CourierAdapter {
	const adapter = adapters.get(code.toLowerCase());

	if (!adapter) {
		const error = new Error(`Unsupported courier partner: ${code}`) as GError;
		error.code = StatusCodes.BAD_REQUEST;
		throw ApiResponse.createError(error);
	}

	return adapter;
}

export function findCourierAdapter(code: string): CourierAdapter | undefined {
	return adapters.get(code.toLowerCase());
}
