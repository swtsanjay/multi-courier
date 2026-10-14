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

export const createBulkOrdersValidation = [
	body()
		.isArray({ min: 1, max: 100 })
		.withMessage('Request body must be an array containing between 1 and 100 orders')
		.custom((orders: unknown[]) => {
			const orderIds = orders.filter((order): order is Record<string, unknown> => Boolean(order && typeof order === 'object')).map((order) => String(order.order_id));

			if (new Set(orderIds).size !== orderIds.length) {
				throw new Error('order_id values must be unique within a bulk request');
			}

			return true;
		}),

	body('*.order_id')
		.trim()
		.matches(/^[A-Za-z0-9_-]{3,100}$/).withMessage('Each order_id must contain 3 to 100 letters, numbers, underscores, or hyphens'),

	body('*.courier_partner')
		.trim()
		.toLowerCase()
		.isLength({ min: 2, max: 50 }).withMessage('Each courier_partner is required'),

	body('*.service_type')
		.trim()
		.isLength({ min: 2, max: 50 }).withMessage('Each service_type is required'),

	body('*.payment_mode')
		.trim()
		.toUpperCase()
		.isIn(['PREPAID', 'COD']).withMessage('Each payment_mode must be PREPAID or COD'),

	body('*.declared_value')
		.isFloat({ min: 0 }).withMessage('Each declared_value must be a non-negative number')
		.toFloat(),

	body('*.parcel').isObject().withMessage('Each parcel is required'),

	body('*.parcel.weight_kg')
		.isFloat({ gt: 0 }).withMessage('Each parcel.weight_kg must be greater than zero')
		.toFloat(),
	
	body('*.shipper')
		.isObject().withMessage('Each shipper is required'),
	body('*.shipper.name')
		.trim()
		.notEmpty().withMessage('Each shipper.name is required'),

	body('*.consignee')
		.isObject().withMessage('Each consignee is required'),

	body('*.consignee.name')
		.trim()
		.notEmpty().withMessage('Each consignee.name is required'),

	body('*.courier_partner').custom((_courier, { req, pathValues }) => {
		const index = Number(pathValues[0]);
		const order = req.body[index] as Record<string, unknown>;
		if (String(order.courier_partner).toLowerCase() !== 'urbanebolt') return true;

		const parcel = order.parcel as Record<string, unknown> | undefined;
		const invoice = order.invoice as Record<string, unknown> | undefined;
		const addresses = [order.shipper, order.consignee, order.return_address];
		const requiredParcelFields = ['length_cm', 'breadth_cm', 'height_cm', 'pieces'];
		const requiredAddressFields = ['name', 'address', 'city', 'state', 'country', 'pincode', 'mobile', 'email'];

		if (!order.item_description || order.collectable_value === undefined) {
			throw new Error('UrbaneBolt orders require item_description and collectable_value');
		}
		if (!parcel || requiredParcelFields.some((field) => parcel[field] === undefined)) {
			throw new Error('UrbaneBolt orders require complete parcel dimensions and pieces');
		}
		if (!invoice || !invoice.number || !invoice.date || invoice.value === undefined) {
			throw new Error('UrbaneBolt orders require invoice number, date, and value');
		}
		if (addresses.some((address) => {
			if (!address || typeof address !== 'object') 
				return true;
			
			return requiredAddressFields.some((field) => !(address as Record<string, unknown>)[field]);
		})) {
			throw new Error('UrbaneBolt orders require complete shipper, consignee, and return addresses');
		}

		return true;
	}),
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
			'CREATED',
			'PICKED_UP',
			'IN_TRANSIT',
			'DELIVERED',
			'CANCELLED',
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
