import { body, CustomValidator, param, query } from 'express-validator';

const isUrbaneBoltOrder: CustomValidator = (_value, { req }) =>
	String(req.body?.courier_partner).toLowerCase() === 'urbanebolt';

const urbaneBoltAddressValidation = (field: 'shipper' | 'consignee' | 'return_address') => [
	body(`${field}.address`)
		.if(isUrbaneBoltOrder).trim()
		.notEmpty().withMessage(`${field}.address is required for UrbaneBolt`),

	body(`${field}.city`)
		.if(isUrbaneBoltOrder).trim()
		.notEmpty().withMessage(`${field}.city is required for UrbaneBolt`),

	body(`${field}.state`)
		.if(isUrbaneBoltOrder).trim()
		.notEmpty().withMessage(`${field}.state is required for UrbaneBolt`),

	body(`${field}.country`)
		.if(isUrbaneBoltOrder).trim()
		.notEmpty().withMessage(`${field}.country is required for UrbaneBolt`),

	body(`${field}.pincode`)
		.if(isUrbaneBoltOrder)
		.matches(/^\d{6}$/).withMessage(`${field}.pincode must be a 6-digit value for UrbaneBolt`),

	body(`${field}.mobile`)
		.if(isUrbaneBoltOrder)
		.matches(/^\d{10}$/).withMessage(`${field}.mobile must be a 10-digit value for UrbaneBolt`),

	body(`${field}.email`).if(isUrbaneBoltOrder).isEmail()
		.withMessage(`${field}.email must be valid for UrbaneBolt`)
];

export const createOrderValidation = [
	body('order_id')
		.trim()
		.matches(/^[A-Za-z0-9_-]{3,100}$/).withMessage('order_id must contain 3 to 100 letters, numbers, underscores, or hyphens'),

	body('courier_partner')
		.trim()
		.toLowerCase()
		.isLength({ min: 2, max: 50 }).withMessage('courier_partner is required'),

	body('service_type')
		.trim()
		.isLength({ min: 2, max: 50 }).withMessage('service_type is required'),

	body('payment_mode')
		.trim()
		.toUpperCase()
		.isIn(['PREPAID', 'COD']).withMessage('payment_mode must be PREPAID or COD'),

	body('declared_value')
		.isFloat({ min: 0 }).withMessage('declared_value must be a non-negative number')
		.toFloat(),

	body('parcel')
		.isObject().withMessage('parcel is required'),

	body('parcel.weight_kg')
		.isFloat({ gt: 0 }).withMessage('parcel.weight_kg must be greater than zero')
		.toFloat(),

	body('parcel.length_cm')
		.optional().isFloat({ gt: 0 })
		.toFloat(),

	body('parcel.breadth_cm')
		.optional().isFloat({ gt: 0 })
		.toFloat(),
	body('parcel.height_cm')
		.optional().isFloat({ gt: 0 })
		.toFloat(),

	body('shipper')
		.isObject().withMessage('shipper is required'),

	body('shipper.name')
		.trim()
		.notEmpty().withMessage('shipper.name is required'),

	body('consignee')
		.isObject().withMessage('consignee is required'),

	body('consignee.name')
		.trim()
		.notEmpty().withMessage('consignee.name is required'),

	body('item_description').if(isUrbaneBoltOrder).trim().notEmpty()
		.withMessage('item_description is required for UrbaneBolt'),

	body('collectable_value').if(isUrbaneBoltOrder).isFloat({ min: 0 }).toFloat()
		.withMessage('collectable_value must be a non-negative number for UrbaneBolt'),

	body('parcel.length_cm').if(isUrbaneBoltOrder).isFloat({ gt: 0 }).toFloat()
		.withMessage('parcel.length_cm is required for UrbaneBolt'),

	body('parcel.breadth_cm').if(isUrbaneBoltOrder).isFloat({ gt: 0 }).toFloat()
		.withMessage('parcel.breadth_cm is required for UrbaneBolt'),

	body('parcel.height_cm').if(isUrbaneBoltOrder).isFloat({ gt: 0 }).toFloat()
		.withMessage('parcel.height_cm is required for UrbaneBolt'),

	body('parcel.pieces').if(isUrbaneBoltOrder).isInt({ min: 1 }).toInt()
		.withMessage('parcel.pieces must be at least 1 for UrbaneBolt'),

	body('invoice').if(isUrbaneBoltOrder).isObject()
		.withMessage('invoice is required for UrbaneBolt'),

	body('invoice.number').if(isUrbaneBoltOrder).trim().notEmpty()
		.withMessage('invoice.number is required for UrbaneBolt'),

	body('invoice.date').if(isUrbaneBoltOrder).isISO8601()
		.withMessage('invoice.date must be a valid date for UrbaneBolt'),

	body('invoice.value').if(isUrbaneBoltOrder).isFloat({ min: 0 }).toFloat()
		.withMessage('invoice.value must be a non-negative number for UrbaneBolt'),

	body('return_address').if(isUrbaneBoltOrder).isObject()
		.withMessage('return_address is required for UrbaneBolt'),

	body('return_address.name').if(isUrbaneBoltOrder).trim().notEmpty()
		.withMessage('return_address.name is required for UrbaneBolt'),

	...urbaneBoltAddressValidation('shipper'),
	...urbaneBoltAddressValidation('consignee'),
	...urbaneBoltAddressValidation('return_address'),
];

export const listOrdersValidation = [
	query('page')
		.optional()
		.isInt({ min: 1 })
		.toInt(),

	query('limit')
		.optional().isInt({ min: 1, max: 100 })
		.toInt(),

	query('status')
		.optional().trim()
		.toUpperCase().isIn([
			'PROCESSING',
			'CREATED',
			'PICKED_UP',
			'IN_TRANSIT',
			'OUT_FOR_DELIVERY',
			'DELIVERED',
			'CANCELLED',
			'RTO',
			'FAILED',
		]),

	query('courier_partner')
		.optional()
		.trim()
		.toLowerCase()
		.isLength({ min: 2, max: 50 })
];

export const orderIdValidation = [
	param('orderId')
		.trim()
		.matches(/^[A-Za-z0-9_-]{3,100}$/)
		.withMessage('orderId is invalid'),
];
