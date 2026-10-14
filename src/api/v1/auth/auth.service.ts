import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import ApiResponse from '../../../lib/api-response';
import { prisma } from '../../../lib/prisma';
import { LoginInput, RegisterInput } from './auth.validation';

const publicUserFields = {
	id: true,
	name: true,
	email: true,
	phone: true,
	createdAt: true,
} as const;

function authError(message: string, code: StatusCodes, name: string): GError {
	const error = new Error(message) as GError;
	error.code = code;
	error.name = name;
	return error;
}

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

function createAccessToken(user: { id: number; email: string }): string {
	return jwt.sign(
		{ email: user.email },
		config.jwt.secretKey,
		{
			subject: String(user.id),
			expiresIn: config.jwt.accessTokenExpiresIn as SignOptions['expiresIn'],
		}
	);
}

async function createRefreshToken(userId: number): Promise<string> {
	const token = randomBytes(48).toString('base64url');
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshTokenExpiresInDays);

	await prisma.refreshToken.create({
		data: { userId, tokenHash: hashToken(token), expiresAt },
	});

	return token;
}

async function createTokenPair(user: { id: number; email: string }) {
	return {
		access_token: createAccessToken(user),
		refresh_token: await createRefreshToken(user.id),
		token_type: 'Bearer',
		expires_in: config.jwt.accessTokenExpiresIn,
	};
}

export async function register(input: RegisterInput) {
	try {
		const passwordHash = await bcrypt.hash(input.password, 12);
		const user = await prisma.user.create({
			data: {
				name: input.name,
				email: input.email,
				phone: input.phone,
				passwordHash,
			},
			select: publicUserFields,
		});

		return user;
	} catch (error) {
		throw ApiResponse.createError(
			authError('Unable to create user', StatusCodes.CONFLICT, 'RegisterError'),
			error instanceof Error ? error : null
		);
	}
}

export async function login(input: LoginInput) {
	try {
		const user = await prisma.user.findFirst({
			where: { email: input.email, deletedAt: null, isActive: true },
		});
		const validPassword = user
			? await bcrypt.compare(input.password, user.passwordHash)
			: false;

		if (!user || !validPassword) {
			throw authError('Email or password is incorrect', StatusCodes.UNAUTHORIZED, 'InvalidCredentialsError');
		}

		return { user: Object.fromEntries(Object.keys(publicUserFields).map((key) => [key, user[key as keyof typeof user]])), ...(await createTokenPair(user)) };
	} catch (error) {
		const code = error instanceof Error && 'code' in error ? Number((error as GError).code) : StatusCodes.INTERNAL_SERVER_ERROR;
		throw ApiResponse.createError(authError('Unable to login', code, 'LoginError'), error instanceof Error ? error : null);
	}
}

export async function refresh(refreshToken: string) {
	try {
		const session = await prisma.refreshToken.findUnique({
			where: { tokenHash: hashToken(refreshToken) },
			include: { user: true },
		});
		if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive || session.user.deletedAt) {
			throw authError('Refresh token is invalid or expired', StatusCodes.UNAUTHORIZED, 'InvalidRefreshTokenError');
		}

		await prisma.refreshToken.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
		return createTokenPair(session.user);
	} catch (error) {
		const code = error instanceof Error && 'code' in error ? Number((error as GError).code) : StatusCodes.INTERNAL_SERVER_ERROR;
		throw ApiResponse.createError(authError('Unable to refresh token', code, 'RefreshTokenError'), error instanceof Error ? error : null);
	}
}

export async function logout(refreshToken: string): Promise<void> {
	try {
		await prisma.refreshToken.updateMany({
			where: { tokenHash: hashToken(refreshToken), revokedAt: null },
			data: { revokedAt: new Date() },
		});
	} catch (error) {
		throw ApiResponse.createError(authError('Unable to logout', StatusCodes.INTERNAL_SERVER_ERROR, 'LogoutError'), error instanceof Error ? error : null);
	}
}
