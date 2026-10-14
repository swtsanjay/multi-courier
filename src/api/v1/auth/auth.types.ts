export type RegisterInput = {
	name: string;
	email: string;
	password: string;
	phone?: string | null;
};

export type LoginInput = {
	email: string;
	password: string;
};

export type TokenPair = {
	access_token: string;
	refresh_token: string;
	token_type: 'Bearer';
	expires_in: string;
};
