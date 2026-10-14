import './loadEnv';
import path from 'path';

const config = {
	IsLocal: process.env.NODE_ENV === 'local',
	IsProd: process.env.NODE_ENV === 'prod',
	logs: {
		level: process.env.LOG_LEVEL || 'info',
	},
  jwt: {
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshTokenExpiresInDays: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS) || 7,
    secretKey: process.env.JWT_SECRET_KEY || 'local-development-secret-change-me'
  },
  courier: {
    timeoutMs: Number(process.env.COURIER_TIMEOUT_MS) || 10000,
    maxRetries: Number(process.env.COURIER_MAX_RETRIES) || 3,
    retryBaseMs: Number(process.env.COURIER_RETRY_BASE_MS) || 250,
  },
  urbaneBolt: {
    baseUrl: String(process.env.URBANEBOLT_BASE_URL || 'https://uat.urbanebolt.in/api/v1').replace(/\/$/, ''),
    username: String(process.env.URBANEBOLT_USERNAME || ''),
    password: String(process.env.URBANEBOLT_PASSWORD || ''),
    customerCode: String(process.env.URBANEBOLT_CUSTOMER_CODE || ''),
  },
	otpLoginExpDuration: 300000, // 5 minutes
	crypto: {
		algorithm: 'aes-256-ctr',
		encryptionKey: Buffer.from('FoCKvdLslUuB2x3EZlKate7XGottHski1LmyqJHvUht=', 'base64'),
		ivLength: 16
	},
	TempFileDir: path.resolve(process.cwd(), 'public'),
	logDir: path.resolve(process.env.LOG_DIR || path.join(process.cwd(), 'logs')),
	port: parseInt(process.env.PORT || '3000', 10)
};

export default config;
