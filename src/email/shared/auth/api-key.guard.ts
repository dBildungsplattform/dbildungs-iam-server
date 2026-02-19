import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { EmailMicroserviceConfig } from '../../../shared/config/email-microservice.config';
import { EmailAppConfig } from '../../../shared/config/email-app.config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    private API_KEY: string;

    public constructor(configService: ConfigService<EmailAppConfig>) {
        this.API_KEY = configService.getOrThrow<EmailMicroserviceConfig>('EMAIL_MICROSERVICE').API_KEY;
    }

    public canActivate(context: ExecutionContext): boolean {
        const req: Request = context.switchToHttp().getRequest<Request>();
        const apiKey: string | string[] | undefined = req.headers['x-api-key'];

        if (!apiKey || apiKey !== this.API_KEY) {
            throw new UnauthorizedException('Invalid API key');
        }
        return true;
    }
}
