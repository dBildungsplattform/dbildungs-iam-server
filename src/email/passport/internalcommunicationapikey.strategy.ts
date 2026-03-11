import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderApiKeyConfig } from '../../shared/config/index.js';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { EmailAppConfig } from '../../shared/config/email-app.config.js';

@Injectable()
export class InternalCommunicationApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, 'api-key') {
    public constructor(private readonly configService: EmailAppConfig) {
        super({ header: 'api-key', prefix: '' }, false);
    }

    public validate(apiKey: string, done: (error: Error | null, valid: boolean | null) => void): void {
        const internalCommunicationApiKeyConfig: HeaderApiKeyConfig = this.configService.HEADER_API_KEY;

        if (
            !internalCommunicationApiKeyConfig.INTERNAL_COMMUNICATION_API_KEY ||
            apiKey !== internalCommunicationApiKeyConfig.INTERNAL_COMMUNICATION_API_KEY
        ) {
            return done(new UnauthorizedException('Invalid API key'), null);
        }
        return done(null, true);
    }
}
