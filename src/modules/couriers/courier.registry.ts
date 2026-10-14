import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../../lib/api-response';
import { CourierAdapter } from './courier.types';
import { MockCourierAdapter } from './mock-courier.adapter';
import { UrbaneBoltAdapter } from './urbanebolt/urbanebolt.adapter';

const adapters = new Map<string, CourierAdapter>();
const mockCourier = new MockCourierAdapter();
const urbaneBolt = new UrbaneBoltAdapter();
adapters.set(mockCourier.code, mockCourier);
adapters.set(urbaneBolt.code, urbaneBolt);

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
