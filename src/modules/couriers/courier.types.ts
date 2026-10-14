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
}
