export type CourierCapabilities = {
	createShipment: boolean;
	tracking: boolean;
	cancellation: boolean;
};

export type CourierListItem = {
	code: string;
	name: string;
	active: boolean;
	configured: boolean;
	implementationStatus: 'AVAILABLE' | 'PLANNED';
	capabilities: CourierCapabilities;
};
