import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { RedisConfig, ServerConfig } from '../../shared/config/index.js';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
    private redisConfig: RedisConfig;

    public constructor(configService: ConfigService<ServerConfig>) {
        super();
        this.redisConfig = configService.getOrThrow<RedisConfig>('REDIS');
    }

    public async check(): Promise<HealthIndicatorResult> {
        const HealthCheckKey: string = 'Redis';

        type RedisState = { available: boolean; message: string };
        let currentState: RedisState = { available: false, message: 'Check has not yet run' };

        const redisClient: RedisClientType = createClient({
            username: this.redisConfig.USERNAME,
            password: this.redisConfig.PASSWORD,
            socket: {
                host: this.redisConfig.HOST,
                port: this.redisConfig.PORT,
                tls: this.redisConfig.USE_TLS,
                key: this.redisConfig.PRIVATE_KEY,
                cert: this.redisConfig.CERTIFICATE_AUTHORITIES,
            },
        });

        await redisClient
            .on('error', (error: Error) => {
                currentState = { available: false, message: `Redis does not seem to be up: ${error.message}` };
            })
            .on('ready', () => {
                currentState = { available: true, message: '' };
            })
            .connect();

        await redisClient.disconnect();

        return super.getStatus(HealthCheckKey, currentState.available, {
            message: currentState.message,
        });
    }
}
