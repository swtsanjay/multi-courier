import { createHash } from 'crypto';
import {
	CourierAdapter,
	CreateShipmentInput,
	CreateShipmentResult,
	TrackShipmentInput,
	TrackShipmentResult,
	CancelShipmentInput,
	CancelShipmentResult,
} from './courier.types';

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

	async trackShipment(input: TrackShipmentInput): Promise<TrackShipmentResult> {
		if (!/^MOCK[A-F0-9]{12}$/.test(input.awbNumber)) {
			throw new Error('Mock Courier shipment was not found');
		}

		const event = {
			status: input.currentStatus,
			location: 'Mock Courier Hub',
			description: `Shipment is ${input.currentStatus.toLowerCase().replaceAll('_', ' ')}`,
			eventTime: new Date(),
			rawPayload: { synthetic: true },
		};

		return {
			status: input.currentStatus,
			events: [event],
			rawResponse: {
				awbNumber: input.awbNumber,
				status: input.currentStatus,
			},
		};
	}

	async cancelShipment(input: CancelShipmentInput): Promise<CancelShipmentResult> {
		if (!/^MOCK[A-F0-9]{12}$/.test(input.awbNumber)) {
			throw new Error('Mock Courier shipment was not found');
		}

		const event = {
			status: 'CANCELLED' as const,
			location: 'Mock Courier Hub',
			description: 'Shipment cancelled',
			eventTime: new Date(),
			rawPayload: { cancelled: true },
		};

		return {
			status: 'CANCELLED',
			event,
			rawResponse: {
				cancelled: true,
				awbNumber: input.awbNumber,
			},
		};
	}
}
