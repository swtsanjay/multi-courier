import { body } from 'express-validator';

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

export const createOrderValidation = [
	body('order_id')
		.trim()
		.matches(/^[A-Za-z0-9_-]{3,100}$/)
		.withMessage('order_id must contain 3 to 100 letters, numbers, underscores, or hyphens'),
	body('courier_partner')
		.trim()
		.toLowerCase()
		.isLength({ min: 2, max: 50 })
		.withMessage('courier_partner is required'),
	body('service_type')
		.trim()
		.isLength({ min: 2, max: 50 })
		.withMessage('service_type is required'),
	body('payment_mode')
		.trim()
		.toUpperCase()
		.isIn(['PREPAID', 'COD'])
		.withMessage('payment_mode must be PREPAID or COD'),
	body('declared_value')
		.isFloat({ min: 0 })
		.withMessage('declared_value must be a non-negative number')
		.toFloat(),
	body('parcel')
		.isObject()
		.withMessage('parcel is required'),
	body('parcel.weight_kg')
		.isFloat({ gt: 0 })
		.withMessage('parcel.weight_kg must be greater than zero')
		.toFloat(),
	body('parcel.length_cm').optional().isFloat({ gt: 0 }).toFloat(),
	body('parcel.breadth_cm').optional().isFloat({ gt: 0 }).toFloat(),
	body('parcel.height_cm').optional().isFloat({ gt: 0 }).toFloat(),
	body('shipper')
		.isObject()
		.withMessage('shipper is required'),
	body('shipper.name')
		.trim()
		.notEmpty()
		.withMessage('shipper.name is required'),
	body('consignee')
		.isObject()
		.withMessage('consignee is required'),
	body('consignee.name')
		.trim()
		.notEmpty()
		.withMessage('consignee.name is required'),
];
