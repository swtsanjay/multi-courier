export type RegisterInput = {
	name: string;
	email: string;
	password: string;
	phone?: string | null;
};

export type LoginInput = { email: string; password: string };

function requiredText(value: unknown, field: string): string {
	if (typeof value !== 'string' || !value.trim()) {
		throw new Error(`${field} is required`);
	}

	return value.trim();
}

function password(value: unknown): string {
	if (typeof value !== 'string' || value.length < 8) {
		throw new Error('password must contain at least 8 characters');
	}

	return value;
}

function email(value: unknown): string {
	if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
		throw new Error('email must be valid');
	}

	return value.trim().toLowerCase();
}

function optionalPhone(value: unknown): string | null | undefined {
	if (value === undefined) {
		return undefined;
	}

	if (value === null || value === '') {
		return null;
	}

	if (typeof value !== 'string' || !/^\+?[0-9]{7,20}$/.test(value.trim())) {
		throw new Error('phone must contain 7 to 20 digits');
	}

	return value.trim();
}

export function validateRegister(body: Record<string, unknown>): RegisterInput {
	return {
		name: requiredText(body.name, 'name'),
		email: email(body.email),
		password: password(body.password),
		phone: optionalPhone(body.phone),
	};
}

export function validateLogin(body: Record<string, unknown>): LoginInput {
	return {
		email: email(body.email),
		password: password(body.password),
	};
}

export function validateRefreshToken(body: Record<string, unknown>): string {
	if (typeof body.refresh_token !== 'string' || !body.refresh_token.trim()) {
		throw new Error('refresh_token is required');
	}

	return body.refresh_token.trim();
}
