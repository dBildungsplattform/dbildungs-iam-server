import { Injectable, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../shared/config/index.js';
import { EmailConfig } from '../../shared/config/email.config.js';

@Injectable()
export class EmailInstanceConfig implements EmailConfig {
    public constructor(public NON_ENABLED_EMAIL_ADDRESSES_DEADLINE_IN_DAYS?: number) {}

    public static fromConfigService(): Provider {
        return {
            provide: EmailInstanceConfig,
            useFactory: (configService: ConfigService<ServerConfig>): EmailInstanceConfig => {
                const emailConfig: EmailConfig = configService.getOrThrow<EmailConfig>('EMAIL');

                return new EmailInstanceConfig(emailConfig.NON_ENABLED_EMAIL_ADDRESSES_DEADLINE_IN_DAYS);
            },
            inject: [ConfigService],
        };
    }
}
