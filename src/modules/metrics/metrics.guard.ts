import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { MetricsConfig, ServerConfig } from '../../shared/config/index.js';

@Injectable()
export class MetricsGuard extends AuthGuard() {
    private readonly username: string;

    private readonly password: string;

    public constructor(config: ConfigService<ServerConfig>) {
        super();
        const metricsConfig: MetricsConfig = config.getOrThrow<MetricsConfig>('METRICS');
        this.username = metricsConfig.USERNAME;
        this.password = metricsConfig.PASSWORD;
    }

    public override canActivate(context: ExecutionContext): boolean {
        const request: Request = context.switchToHttp().getRequest<Request>();
        const authHeader: string | undefined = request.headers.authorization;

        if (!authHeader?.startsWith('Basic ')) {
            return false;
        }

        const base64Credentials: string | undefined = authHeader.split(' ')[1];
        if (!base64Credentials) {
            return false;
        }
        const credentials: string = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password]: string[] = credentials.split(':');

        if (username !== this.username || password !== this.password) {
            return false;
        }

        return true;
    }
}
