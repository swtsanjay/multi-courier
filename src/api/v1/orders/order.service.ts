import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../../../lib/api-response';
import { prisma } from '../../../lib/prisma';
import { getCourierAdapter } from '../../../modules/couriers/courier.registry';
import { BulkOrderResult, CreateOrderInput, ListOrdersInput } from './order.types';

const orderInclude = {
	courierPartner: { select: { code: true, name: true } },
	shipment: true,
} as const;

function serviceError(message: string, code: StatusCodes): GError {
	const error = new Error(message) as GError;
	error.code = code;
	return error;
}

export async function createOrder(userId: number, input: CreateOrderInput) {
	try {
		const existingOrder = await prisma.order.findUnique({
			where: { orderId: input.order_id },
			include: orderInclude,
		});

		if (existingOrder) {
			return { order: existingOrder, replayed: true };
		}

		const adapter = getCourierAdapter(input.courier_partner);
		const courierPartner = await prisma.courierPartner.findFirst({
			where: { code: input.courier_partner, isActive: true },
		});

		if (!courierPartner) {
			throw serviceError('Courier partner is not active', StatusCodes.BAD_REQUEST);
		}

		const pendingOrder = await prisma.order.create({
			data: {
				orderId: input.order_id,
				createdById: userId,
				courierPartnerId: courierPartner.id,
				normalizedPayload: input as Prisma.InputJsonValue,
				shipment: { create: { status: 'CREATED' } },
			},
			include: orderInclude,
		});

		try {
			const result = await adapter.createShipment({
				orderId: input.order_id,
				payload: input,
			});

			const order = await prisma.order.update({
				where: { id: pendingOrder.id },
				data: {
					shipment: {
						update: {
							status: result.status,
							courierShipmentId: result.courierShipmentId,
							awbNumber: result.awbNumber,
							requestPayload: result.rawRequest as Prisma.InputJsonValue,
							responsePayload: result.rawResponse as Prisma.InputJsonValue,
						},
					},
				},
				include: orderInclude,
			});

			return { order, replayed: false };
		} catch (error) {

			await prisma.shipment.update({
				where: { orderId: pendingOrder.id },
				data: {
					status: 'FAILED',
					errorMessage: error instanceof Error ? error.message : 'Courier request failed',
				},
			});
			throw error;
		}
	} catch (error) {
		const code = error instanceof Error && 'code' in error
			? Number((error as GError).code)
			: StatusCodes.INTERNAL_SERVER_ERROR;
		throw ApiResponse.createError(
			serviceError('Unable to create order', code),
			error instanceof Error ? error : null
		);
	}
}

export async function createBulkOrders(userId: number, inputs: CreateOrderInput[]) {
	const results: BulkOrderResult[] = [];
	const concurrency = 5;

	for (let index = 0; index < inputs.length; index += concurrency) {
		const batch = inputs.slice(index, index + concurrency);
		const batchResults = await Promise.all(batch.map(async (input): Promise<BulkOrderResult> => {
			try {
				const result = await createOrder(userId, input);
				return {
					order_id: input.order_id,
					success: true,
					replayed: result.replayed,
					order: result.order,
				};
			} catch (error) {
				return {
					order_id: input.order_id,
					success: false,
					error: error instanceof Error ? error.message : 'Unable to create order',
				};
			}
		}));

		results.push(...batchResults);
	}

	const succeeded = results.filter((result) => result.success).length;

	return {
		total: results.length,
		succeeded,
		failed: results.length - succeeded,
		results,
	};
}

export async function listOrders(userId: number, input: ListOrdersInput) {
	try {
		const page = input.page || 1;
		const limit = input.limit || 20;
		const where: Prisma.OrderWhereInput = {
			createdById: userId,
			courierPartner: input.courier_partner
				? { code: input.courier_partner }
				: undefined,
			shipment: input.status
				? { status: input.status }
				: undefined,
		};

		const [orders, total] = await prisma.$transaction([
			prisma.order.findMany({
				where,
				include: orderInclude,
				orderBy: { createdAt: 'desc' },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.order.count({ where }),
		]);

		return {
			orders,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	} catch (error) {
		throw ApiResponse.createError(
			serviceError('Unable to fetch orders', StatusCodes.INTERNAL_SERVER_ERROR),
			error instanceof Error ? error : null
		);
	}
}

export async function getOrder(userId: number, orderId: string) {
	try {
		const order = await prisma.order.findFirst({
			where: {
				orderId,
				createdById: userId,
			},
			include: orderInclude,
		});

		if (!order) {
			throw serviceError('Order not found', StatusCodes.NOT_FOUND);
		}

		return order;
	} catch (error) {
		const code = error instanceof Error && 'code' in error
			? Number((error as GError).code)
			: StatusCodes.INTERNAL_SERVER_ERROR;

		throw ApiResponse.createError(
			serviceError('Unable to fetch order', code),
			error instanceof Error ? error : null
		);
	}
}

export async function trackOrder(userId: number, orderId: string) {
	try {
		const order = await prisma.order.findFirst({
			where: { orderId, createdById: userId },
			include: orderInclude,
		});

		if (!order) {
			throw serviceError('Order not found', StatusCodes.NOT_FOUND);
		}

		if (!order.shipment?.awbNumber) {
			throw serviceError('Order does not have a trackable shipment', StatusCodes.CONFLICT);
		}

		const adapter = getCourierAdapter(order.courierPartner.code);
		const result = await adapter.trackShipment({
			awbNumber: order.shipment.awbNumber,
			currentStatus: order.shipment.status,
		});

		await prisma.$transaction([
			prisma.shipment.update({
				where: { id: order.shipment.id },
				data: {
					status: result.status,
					responsePayload: result.rawResponse as Prisma.InputJsonValue,
				},
			}),
			prisma.shipmentTrackingHistory.createMany({
				data: result.events.map((event) => ({
					shipmentId: order.shipment!.id,
					status: event.status,
					location: event.location,
					description: event.description,
					eventTime: event.eventTime,
					rawPayload: event.rawPayload as Prisma.InputJsonValue,
				})),
			}),
		]);

		const shipment = await prisma.shipment.findUnique({
			where: { id: order.shipment.id },
			include: {
				trackingHistory: {
					orderBy: { eventTime: 'asc' },
				},
			},
		});

		return { orderId: order.orderId, shipment };
	} catch (error) {
		const code = error instanceof Error && 'code' in error
			? Number((error as GError).code)
			: StatusCodes.INTERNAL_SERVER_ERROR;

		throw ApiResponse.createError(
			serviceError('Unable to track order', code),
			error instanceof Error ? error : null
		);
	}
}

export async function cancelOrder(userId: number, orderId: string) {
	try {
		const order = await prisma.order.findFirst({
			where: { orderId, createdById: userId },
			include: orderInclude,
		});

		if (!order) {
			throw serviceError('Order not found', StatusCodes.NOT_FOUND);
		}

		if (!order.shipment?.awbNumber) {
			throw serviceError('Order does not have a cancellable shipment', StatusCodes.CONFLICT);
		}

		if (order.shipment.status === 'CANCELLED') {
			const shipment = await prisma.shipment.findUnique({
				where: { id: order.shipment.id },
				include: { trackingHistory: { orderBy: { eventTime: 'asc' } } },
			});

			return { orderId: order.orderId, shipment, replayed: true };
		}

		if (order.shipment.status === 'DELIVERED') {
			throw serviceError(
				`A ${order.shipment.status.toLowerCase()} shipment cannot be cancelled`,
				StatusCodes.CONFLICT
			);
		}

		const adapter = getCourierAdapter(order.courierPartner.code);
		const result = await adapter.cancelShipment({
			awbNumber: order.shipment.awbNumber,
		});

		await prisma.$transaction([
			prisma.shipment.update({
				where: { id: order.shipment.id },
				data: {
					status: result.status,
					responsePayload: result.rawResponse as Prisma.InputJsonValue,
				},
			}),
			prisma.shipmentTrackingHistory.create({
				data: {
					shipmentId: order.shipment.id,
					status: result.event.status,
					location: result.event.location,
					description: result.event.description,
					eventTime: result.event.eventTime,
					rawPayload: result.event.rawPayload as Prisma.InputJsonValue,
				},
			}),
		]);

		const shipment = await prisma.shipment.findUnique({
			where: { id: order.shipment.id },
			include: { trackingHistory: { orderBy: { eventTime: 'asc' } } },
		});

		return { orderId: order.orderId, shipment, replayed: false };
	} catch (error) {
		const code = error instanceof Error && 'code' in error
			? Number((error as GError).code)
			: StatusCodes.INTERNAL_SERVER_ERROR;

		throw ApiResponse.createError(
			serviceError('Unable to cancel order', code),
			error instanceof Error ? error : null
		);
	}
}
