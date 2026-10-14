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

export interface CourierAdapter {
	code: string;
	createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
}
