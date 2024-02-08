import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { RedisConfig } from '../../shared/config/index.js';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
    private redisClient: RedisClientType;

    public constructor(redisConfig: RedisConfig) {
        super();
        this.redisClient = createClient({
            username: redisConfig.USERNAME,
            password: redisConfig.PASSWORD,
            socket: {
                host: redisConfig.HOST,
                port: redisConfig.PORT,
                tls: redisConfig.USE_TLS,
                key: redisConfig.PRIVATE_KEY,
                cert: redisConfig.CERTIFICATE_AUTHORITIES,
            },
        });
    }

    public async check(): Promise<HealthIndicatorResult> {
        const HealthCheckKey: string = 'Redis';

        type RedisState = { available: boolean; message: string };
        let currentState: RedisState = { available: false, message: 'Check has not yet run' };

        await this.redisClient
            .on('error', (error: Error) => {
                currentState = { available: false, message: error.message };
                void this.redisClient.disconnect();
            })
            .on('ready', () => {
                currentState = { available: true, message: '' };
                void this.redisClient.disconnect();
            })
            .connect();

        return super.getStatus(HealthCheckKey, currentState.available, {
            message: `Redis does not seem to be up: ${currentState.message}`,
        });
    }
}
