import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as CustomStrategy } from 'passport-custom';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { InternalCommunicationApiKeyConfig } from '../../../shared/config/index.js';

const INTERNAL_COMMUNICATION_API_KEY_CONFIG_KEY: string = 'INTERNAL_COMMUNICATION_API_KEY';

@Injectable()
export class InternalCommunicationApiKeyStrategy extends PassportStrategy(CustomStrategy, 'api-key') {
    public constructor(private readonly configService: ConfigService) {
        super();
    }

    public validate(req: Request): boolean {
        const internalCommunicationApiKeyConfig: InternalCommunicationApiKeyConfig =
            this.configService.getOrThrow<InternalCommunicationApiKeyConfig>(INTERNAL_COMMUNICATION_API_KEY_CONFIG_KEY);
        const requestApiKey: string | undefined = req.headers['api-key'] as string | undefined;

        if (
            !internalCommunicationApiKeyConfig.INTERNAL_COMMUNICATION_API_KEY ||
            !requestApiKey ||
            internalCommunicationApiKeyConfig.INTERNAL_COMMUNICATION_API_KEY !== requestApiKey
        ) {
            throw new UnauthorizedException('Invalid API key');
        }

        return true;
    }
}
