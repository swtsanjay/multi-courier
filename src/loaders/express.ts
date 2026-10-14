import cors from 'cors';
import express, { Application, Request as ExpressRequest, Response as ExpressResponse, NextFunction as ExpressNextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import morgan from 'morgan';
import Response from '../lib/api-response';
import authRoutes from '../api/v1/auth/auth.route';
import { configureTrustedProxies } from './trusted-proxies';
// import rateLimiter from '../shared-services/middleware/rateLimiter';
export default ({ app }: { app: Application }) => {
	configureTrustedProxies(app);

	// HTTP request logger
	app.use(morgan('dev'));

	// The magic package that prevents frontend developers going nuts
	// Alternate description:
	// Enable Cross Origin Resource Sharing to all origins by default
	const configuredOrigins = String(process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
		.split(',')
		.map((origin) => origin.trim().replace(/\/$/, ''))
		.filter(Boolean);
	const defaultOrigins = [
		'http://localhost:3000',
		'http://127.0.0.1:3000',
		'http://localhost:5173',
		'http://127.0.0.1:5173',
		'https://bms.customcraftapparel.in',
		'https://vastriqo.com',
		'https://www.vastriqo.com',
		'https://www.customcraftapparel.in'
	];
	const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);
	const isAllowedLocalOrigin = (origin: string) => (
		process.env.NODE_ENV === 'local'
		&& /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
	);
	app.use(cors({
		credentials: true,
		origin(origin, callback) {
			if (!origin || allowedOrigins.has(origin) || isAllowedLocalOrigin(origin)) {
				return callback(null, true);
			}
			return callback(new Error(`Origin ${origin} is not allowed by CORS`));
		}
	}));

	// Some sauce that always add since 2014
	// "Lets you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it."
	// Maybe not needed anymore ?
	// app.use(methodOverride());

	app.use(express.json({ limit: '1mb' }));

	// Load API routes
	app.use('/api/v1/auth', authRoutes);

	// catch 404 and forward to error handler
	app.use((req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
		const err: GError = new Error(`Route ${req.url} Not Found`);
		err.code = StatusCodes.NOT_FOUND;
		next(err);
	});

	// error handlers
	app.use((
		(err: GError, req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
			void next;
			/*
			 * Handle 401 thrown by express-jwt library
			 */
			if (err.name === 'UnauthorizedError') {
				return Response.fail(res, err.message, null, StatusCodes.INTERNAL_SERVER_ERROR);
			}

			/*
			 * Handle multer error
			 */
			if (err.name === 'MulterError') {
				return Response.fail(res, err.message, StatusCodes.INTERNAL_SERVER_ERROR);
			}
			const statusCode = Number((err as GError & { statusCode?: number }).statusCode || err.code || StatusCodes.INTERNAL_SERVER_ERROR);
			return Response.fail(res, err.message, null, statusCode, err.extra);
		}
	) as (
		err: Error,
		req: ExpressRequest,
		res: ExpressResponse,
		next: ExpressNextFunction
	) => void);
};
