import { StatusCodes } from 'http-status-codes';
import config from '../../config';

export class CourierHttpError extends Error implements GError {
	code: number;
	authenticationFailure: boolean;
	retryable: boolean;

	constructor(
		message: string,
		options: { code?: number; authenticationFailure?: boolean; retryable?: boolean } = {}
	) {
		super(message);
		this.name = 'CourierHttpError';
		this.code = options.code ?? StatusCodes.BAD_GATEWAY;
		this.authenticationFailure = options.authenticationFailure ?? false;
		this.retryable = options.retryable ?? false;
	}
}

export class CourierHttpClient {
	constructor(private readonly baseUrl: string, private readonly timeoutMs = config.courier.timeoutMs) { }

	async request<T>(
		path: string,
		options: {
			method?: 'GET' | 'POST';
			headers?: Record<string, string>;
			body?: unknown;
		} = {}
	): Promise<T> {
		let response: globalThis.Response;

		try {
			response = await fetch(`${this.baseUrl}${path}`, {
				method: options.method ?? 'GET',
				headers: {
					Accept: 'application/json',
					...options.headers,
				},
				body: options.body === undefined ? undefined : JSON.stringify(options.body),
				signal: AbortSignal.timeout(this.timeoutMs),
			});
		} catch (error) {
			const isTimeout = error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name);

			throw new CourierHttpError(
				isTimeout ? 'Courier request timed out' : 'Courier network request failed',
				{ retryable: true }
			);
		}

		const responseText = await response.text();
		let data: unknown = null;

		if (responseText) {
			try {
				data = JSON.parse(responseText);
			} catch {
				data = { unparsedResponse: true };
			}
		}

		if (!response.ok) {
			const authenticationFailure = [401, 403].includes(response.status);
			const validationFailure = response.status >= 400 && response.status < 500 && !authenticationFailure && response.status !== 429;

			throw new CourierHttpError('Courier rejected the operation', {
				code: validationFailure ? StatusCodes.BAD_REQUEST : StatusCodes.BAD_GATEWAY,
				authenticationFailure,
				retryable: response.status === 429 || response.status >= 500,
			});
		}

		return data as T;
	}
}
