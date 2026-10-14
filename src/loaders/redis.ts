import { createClient, RedisClientType } from 'redis';
import Logger from '../lib/Logger';

const client: RedisClientType = createClient({
    url: 'redis://default:XXXX@1.1.1.1:6679'
});

client.on('error', err => {
    console.log('Redis Client Error', err);
    Logger.error(`🔴Redis Client Crashed ${err}`);
});

async function connectToRedis() {
    await client.connect();
    console.log('🟢 Redis Client Connected Successfully');
}

export { client, connectToRedis };
