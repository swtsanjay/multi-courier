import { StatusCodes } from 'http-status-codes';
import ApiResponse from '../../../lib/api-response';
import { prisma } from '../../../lib/prisma';
import { findCourierAdapter } from '../../../modules/couriers/courier.registry';
import { CourierListItem } from './courier.types';

function serviceError(message: string): GError {
	const error = new Error(message) as GError;
	error.code = StatusCodes.INTERNAL_SERVER_ERROR;
	error.name = 'ListCouriersError';

	return error;
}

export async function listCouriers(): Promise<CourierListItem[]> {
	try {
		const partners = await prisma.courierPartner.findMany({ orderBy: { name: 'asc' } });

		return partners.map((partner) => {
			const adapter = findCourierAdapter(partner.code);

			return {
				code: partner.code,
				name: partner.name,
				active: partner.isActive,
				configured: adapter?.configured ?? false,
				implementationStatus: adapter ? 'AVAILABLE' : 'PLANNED',
				capabilities: adapter?.capabilities ?? {
					createShipment: false,
					tracking: false,
					cancellation: false
				}
			};
		});
	} catch (error) {
		throw ApiResponse.createError(
			serviceError('Unable to fetch couriers'),
			error instanceof Error ? error : null
		);
	}
}
