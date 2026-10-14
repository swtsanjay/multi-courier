import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import { CreateOrderInput } from '../../../api/v1/orders/order.types';
import ApiResponse from '../../../lib/api-response';
import { CourierHttpClient, CourierHttpError } from '../courier-http-client';
import { CancelShipmentInput, CancelShipmentResult, CourierAdapter, CreateShipmentInput, CreateShipmentResult, TrackShipmentInput, TrackShipmentResult } from '../courier.types';
import { extractToken, normalizeManifestResponse, normalizeTrackingResponse, toUrbaneBoltManifest } from './urbanebolt.mapper';

export class UrbaneBoltAdapter implements CourierAdapter {
	readonly code = 'urbanebolt';
	readonly name = 'UrbaneBolt';
	readonly capabilities = { createShipment: true,	tracking: true,	cancellation: true };

	private readonly client = new CourierHttpClient(config.urbaneBolt.baseUrl);
	private accessToken?: string;

	get configured(): boolean {
		return Boolean( config.urbaneBolt.username && config.urbaneBolt.password && config.urbaneBolt.customerCode );
	}

	async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
		this.ensureConfigured();
		const manifest = toUrbaneBoltManifest( input.payload as CreateOrderInput, config.urbaneBolt.customerCode );
		const response = await this.authorizedRequest<unknown>('/services/manifest/', { method: 'POST', body: manifest });
		const result = normalizeManifestResponse(response, input.orderId);

		return { ...result, rawRequest: { manifest } };
	}

	async trackShipment(input: TrackShipmentInput): Promise<TrackShipmentResult> {
		this.ensureConfigured();

		const awb = encodeURIComponent(input.awbNumber);
		const response = await this.authorizedRequest<unknown>( `/services/tracking-pub/?awb=${awb}`);

		return normalizeTrackingResponse(response);
	}

	async cancelShipment(input: CancelShipmentInput): Promise<CancelShipmentResult> {
		this.ensureConfigured();
		const response = await this.authorizedRequest<Record<string, unknown>>(
			'/services/cancel/',
			{ method: 'POST', body: { awbs: input.awbNumber } }
		);

		return {
			status: 'CANCELLED',
			event: {
				status: 'CANCELLED',
				eventTime: new Date(),
				description: 'Shipment cancelled by UrbaneBolt',
				rawPayload: response
			},
			rawResponse: response
		};
	}

	private ensureConfigured(): void {
		if (this.configured) return;

		const error = new Error('UrbaneBolt credentials are not configured') as GError;
		error.code = StatusCodes.SERVICE_UNAVAILABLE;
		throw ApiResponse.createError(error);
	}

	private async authenticate(): Promise<string> {
		const response = await this.withRetries(() => this.client.request<unknown>(
			'/auth/getToken/',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: {
					username: config.urbaneBolt.username,
					password: config.urbaneBolt.password,
				}
			}
		));
		const token = extractToken(response);

		if (!token) {
			throw new CourierHttpError('UrbaneBolt authentication response did not contain a token');
		}

		this.accessToken = token;
		return token;
	}

	private async authorizedRequest<T>(
		path: string,
		options: { method?: 'GET' | 'POST'; body?: unknown } = {}
	): Promise<T> {
		let token = this.accessToken ?? await this.authenticate();

		try {
			return await this.sendAuthorized<T>(path, token, options);
		} catch (error) {
			if (!(error instanceof CourierHttpError) || !error.authenticationFailure) {
				throw error;
			}

			this.accessToken = undefined;
			token = await this.authenticate();
			return this.sendAuthorized<T>(path, token, options);
		}
	}

	private sendAuthorized<T>(
		path: string,
		token: string,
		options: { method?: 'GET' | 'POST'; body?: unknown }
	): Promise<T> {
		return this.withRetries(() => this.client.request<T>(path, {
			...options,
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			}
		}));
	}

	private async withRetries<T>(operation: () => Promise<T>): Promise<T> {
		for (let attempt = 0; ; attempt += 1) {
			try {
				return await operation();
			} catch (error) {
				const shouldRetry = error instanceof CourierHttpError && error.retryable && attempt < config.courier.maxRetries;

				if (!shouldRetry) throw error;

				const delayMs = config.courier.retryBaseMs * (2 ** attempt);
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			}
		}
	}
}
