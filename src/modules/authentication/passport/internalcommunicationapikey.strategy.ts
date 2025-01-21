import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { InternalCommunicationApiKeyConfig } from '../../../shared/config/index.js';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

const INTERNAL_COMMUNICATION_API_KEY_CONFIG_KEY: string = 'INTERNAL_COMMUNICATION_API_KEY';

@Injectable()
export class InternalCommunicationApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, 'api-key') {
    public constructor(private readonly configService: ConfigService) {
        console.log("CONSTRUCTOR")
        super(
            { header: 'api-key', prefix: '' },
            true,
            (apiKey: string, done: (error: Error | null, valid: boolean | null) => void) => {
                this.validate(apiKey, done);
            },
        );
    }

    private validate(apiKey: string, done: (error: Error | null, valid: boolean | null) => void): void {
        console.log("FUNTION")
        const internalCommunicationApiKeyConfig: InternalCommunicationApiKeyConfig =
            this.configService.getOrThrow<InternalCommunicationApiKeyConfig>(INTERNAL_COMMUNICATION_API_KEY_CONFIG_KEY);

        if (
            !internalCommunicationApiKeyConfig.INTERNAL_COMMUNICATION_API_KEY ||
            apiKey !== internalCommunicationApiKeyConfig.INTERNAL_COMMUNICATION_API_KEY
        ) {
            return done(new UnauthorizedException('Invalid API key'), null);
        }

        return done(null, true); // Validation succeeded
    }
}
