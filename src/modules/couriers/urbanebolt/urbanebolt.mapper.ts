import { CreateOrderInput } from '../../../api/v1/orders/order.types';
import { CreateShipmentResult, TrackShipmentResult, TrackingStatus } from '../courier.types';

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const statusMap: Record<string, TrackingStatus> = {
	created: 'CREATED',
	manifested: 'CREATED',
	booked: 'CREATED',
	'picked up': 'PICKED_UP',
	'pickup done': 'PICKED_UP',
	'in transit': 'IN_TRANSIT',
	intransit: 'IN_TRANSIT',
	'out for delivery': 'IN_TRANSIT',
	ofd: 'IN_TRANSIT',
	delivered: 'DELIVERED',
	cancelled: 'CANCELLED',
	canceled: 'CANCELLED',
	rto: 'FAILED',
	'return to origin': 'FAILED',
	failed: 'FAILED',
};

function addressFields(prefix: string, address: JsonObject) {
	return {
		[`${prefix}Name`]: address.name,
		[`${prefix}Address`]: address.address,
		[`${prefix}AddressType`]: address.address_type ?? (prefix === 'cons' ? 'Home' : 'Seller'),
		[`${prefix}City`]: address.city,
		[`${prefix}State`]: address.state,
		[`${prefix}Country`]: address.country ?? 'INDIA',
		[`${prefix}Pincode`]: Number(address.pincode),
		[`${prefix}Mobile`]: Number(address.mobile),
		[`${prefix}Email`]: address.email,
	};
}

export function toUrbaneBoltManifest(order: CreateOrderInput, customerCode: string) {
	const parcel = order.parcel as JsonObject;
	const invoice = order.invoice as JsonObject;
	const returnAddress = (order.return_address ?? order.shipper) as JsonObject;

	return [{
		customerCode,
		orderNumber: order.order_id,
		declaredValue: order.declared_value,
		itemDescription: order.item_description,
		collectableValue: order.collectable_value ?? 0,
		height: parcel.height_cm,
		length: parcel.length_cm,
		breadth: parcel.breadth_cm,
		weight: parcel.weight_kg,
		pieces: parcel.pieces ?? 1,
		serviceType: order.service_type,
		payMode: order.payment_mode === 'PREPAID' ? 'PPD' : 'COD',
		invoiceNumber: invoice.number,
		invoiceDate: invoice.date,
		invoiceValue: invoice.value,
		itemQuantity: parcel.pieces ?? 1,
		...addressFields('shpr', order.shipper),
		...addressFields('cons', order.consignee),
		...addressFields('rtn', returnAddress),
	}];
}

function firstObject(value: unknown): JsonObject | undefined {
	if (Array.isArray(value)) return isObject(value[0]) ? value[0] : undefined;
	return isObject(value) ? value : undefined;
}

function candidates(payload: unknown): JsonObject[] {
	const root = firstObject(payload);
	const data = firstObject(root?.data);
	const result = firstObject(root?.result);
	return [data, result, root].filter((value): value is JsonObject => Boolean(value));
}

export function extractToken(payload: unknown): string | undefined {
	for (const value of candidates(payload)) {
		const token = value.accessToken ?? value.access_token ?? value.access ?? value.token;
		if (token) return String(token);
	}
	return undefined;
}

export function normalizeStatus(status: unknown): TrackingStatus {
	return statusMap[String(status ?? '').trim().toLowerCase()] ?? 'FAILED';
}

export function normalizeManifestResponse(payload: unknown, orderId: string): CreateShipmentResult {
	const values = candidates(payload);
	const read = (...keys: string[]) => {
		for (const value of values) {
			for (const key of keys) if (value[key] !== undefined) return value[key];
		}
		return undefined;
	};
	const awbNumber = read('awbNumber', 'awb_number', 'awb', 'waybill');
	if (!awbNumber) throw new Error('UrbaneBolt manifest response did not contain an AWB');

	return {
		courierShipmentId: String(read('shipmentId', 'shipment_id', 'orderId', 'order_id') ?? orderId),
		awbNumber: String(awbNumber),
		status: 'CREATED',
		rawRequest: {},
		rawResponse: payload as JsonObject,
	};
}

export function normalizeTrackingResponse(payload: unknown): TrackShipmentResult {
	const values = candidates(payload);
	const current = values.find((value) => value.currentStatus || value.shipmentStatus || value.status) ?? values[0] ?? {};
	const historyValue = current.history ?? current.scans ?? current.trackingHistory;
	const history = Array.isArray(historyValue) ? historyValue.filter(isObject) : [];
	return {
		status: normalizeStatus(current.currentStatus ?? current.shipmentStatus ?? current.status),
		events: history.map((event: JsonObject) => ({
			status: normalizeStatus(event.status ?? event.scan ?? event.event),
			eventTime: new Date(String(
				event.eventTime
				?? event.event_time
				?? event.timestamp
				?? event.date
				?? new Date().toISOString()
			)),
			location: event.location || event.city
				? String(event.location ?? event.city)
				: undefined,
			description: event.description || event.remark
				? String(event.description ?? event.remark)
				: undefined,
			rawPayload: event,
		})),
		rawResponse: payload as JsonObject,
	};
}
