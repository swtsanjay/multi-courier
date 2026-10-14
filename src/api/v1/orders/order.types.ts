export type CreateOrderInput = {
	order_id: string;
	courier_partner: string;
	service_type: string;
	payment_mode: 'PREPAID' | 'COD';
	declared_value: number;
	parcel: Record<string, unknown>;
	shipper: Record<string, unknown>;
	consignee: Record<string, unknown>;
	[key: string]: unknown;
};

export type ListOrdersInput = {
	page: number;
	limit: number;
	status?: 'PROCESSING' | 'CREATED' | 'FAILED';
	courier_partner?: string;
};
