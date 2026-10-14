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
	status?: 'CREATED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'FAILED';
	courier_partner?: string;
};

export type BulkOrderResult = {
	order_id: string;
	success: boolean;
	replayed?: boolean;
	order?: unknown;
	error?: string;
};
