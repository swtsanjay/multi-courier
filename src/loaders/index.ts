import { Express } from 'express';
import { Server } from 'http';
import expressLoader from './express';
import Logger from '../lib/Logger';
import { connectDatabase } from '../lib/prisma';
require('../types/global');
interface LoaderParams {
	expressApp: Express;
	server?: Server;
}

const loader = async function ({ expressApp }: LoaderParams): Promise<void> {
	await connectDatabase();
	Logger.info('🟢 Database Connected Successfully !!');
	console.log('✌️ Database Connected Successfully !!');

	await expressLoader({ app: expressApp });
	Logger.info('🟢 Express App initialsed !!');

};

export default loader;
