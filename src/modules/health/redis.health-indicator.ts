import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { ValkeyConfig, ServerConfig } from '../../shared/config/index.js';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ValkeyHealthIndicator extends HealthIndicator {
    private valkeyConfig: ValkeyConfig;

    public constructor(configService: ConfigService<ServerConfig>) {
        super();
        this.valkeyConfig = configService.getOrThrow<ValkeyConfig>('VALKEY');
    }

    public async check(): Promise<HealthIndicatorResult> {
        const HealthCheckKey: string = 'Valkey';

        type RedisState = { available: boolean; message: string };
        let currentState: RedisState = { available: false, message: 'Check has not yet run' };

        const redisClient: RedisClientType = createClient({
            username: this.valkeyConfig.USERNAME,
            password: this.valkeyConfig.PASSWORD,
            socket: {
                host: this.valkeyConfig.HOST,
                port: this.valkeyConfig.PORT,
                tls: this.valkeyConfig.USE_TLS || undefined,
                key: this.valkeyConfig.PRIVATE_KEY,
                cert: this.valkeyConfig.CERTIFICATE_AUTHORITIES,
                connectTimeout: 1000,
                reconnectStrategy: false,
            },
        });
        try {
            await redisClient
                .on('error', (error: Error) => {
                    currentState = { available: false, message: `Valkey does not seem to be up: ${error.message}` };
                })
                .on('ready', () => {
                    currentState = { available: true, message: '' };
                })
                .connect();

            await redisClient.disconnect();
        } catch (reason) {
            currentState = {
                available: false,
                message: `Exception while making connection: ${String(reason)}`,
            };
        }

        return super.getStatus(HealthCheckKey, currentState.available, {
            message: currentState.message,
        });
    }
}
