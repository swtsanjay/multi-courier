import { createHash } from 'crypto';
import { CourierAdapter, CreateShipmentInput, CreateShipmentResult } from './courier.types';

export class MockCourierAdapter implements CourierAdapter {
	readonly code = 'mock_courier';
	readonly name = 'Mock Courier';
	readonly configured = true;
	readonly capabilities = {
		createShipment: true,
		tracking: true,
		cancellation: true,
	};

	async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
		const suffix = createHash('sha256')
			.update(input.orderId)
			.digest('hex')
			.slice(0, 12)
			.toUpperCase();

		const courierShipmentId = `MOCK-SHP-${suffix}`;
		const awbNumber = `MOCK${suffix}`;

		return {
			courierShipmentId,
			awbNumber,
			status: 'CREATED',
			rawRequest: input.payload,
			rawResponse: { accepted: true, courierShipmentId, awbNumber }
		};
	}
}
