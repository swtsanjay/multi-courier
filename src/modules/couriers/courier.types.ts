export type CreateShipmentInput = {
	orderId: string;
	payload: Record<string, unknown>;
};

export type CreateShipmentResult = {
	courierShipmentId: string;
	awbNumber: string;
	status: 'CREATED';
	rawRequest: Record<string, unknown>;
	rawResponse: Record<string, unknown>;
};

export type TrackingStatus =
	| 'CREATED'
	| 'PICKED_UP'
	| 'IN_TRANSIT'
	| 'OUT_FOR_DELIVERY'
	| 'DELIVERED'
	| 'CANCELLED'
	| 'RTO'
	| 'FAILED';

export type TrackingEvent = {
	status: TrackingStatus;
	location?: string;
	description?: string;
	eventTime: Date;
	rawPayload?: Record<string, unknown>;
};

export type TrackShipmentInput = {
	awbNumber: string;
	currentStatus: TrackingStatus;
};

export type TrackShipmentResult = {
	status: TrackingStatus;
	events: TrackingEvent[];
	rawResponse: Record<string, unknown>;
};

export type CancelShipmentInput = {
	awbNumber: string;
};

export type CancelShipmentResult = {
	status: 'CANCELLED';
	event: TrackingEvent;
	rawResponse: Record<string, unknown>;
};

export type CourierCapabilities = {
	createShipment: boolean;
	tracking: boolean;
	cancellation: boolean;
};

export interface CourierAdapter {
	readonly code: string;
	readonly name: string;
	readonly configured: boolean;
	readonly capabilities: CourierCapabilities;
	createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
	trackShipment(input: TrackShipmentInput): Promise<TrackShipmentResult>;
	cancelShipment(input: CancelShipmentInput): Promise<CancelShipmentResult>;
}
