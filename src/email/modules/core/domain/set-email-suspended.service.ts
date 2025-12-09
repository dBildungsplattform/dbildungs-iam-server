import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { EmailAddressStatusEnum } from '../persistence/email-address-status.entity.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { EmailAddress } from './email-address.js';

@Injectable()
export class SetEmailSuspendedService {
    public constructor(
        private readonly emailAddressRepo: EmailAddressRepo,
        private readonly logger: ClassLogger,
    ) {}

    public async setEmailSuspended(params: { emailAddress: string }): Promise<void> {
        this.logger.info(`Received request to set email address ${params.emailAddress} to suspended.`);
        const email: Option<EmailAddress<true>> = await this.emailAddressRepo.findEmailAddress(params.emailAddress);

        if (!email) {
            this.logger.info(`Email address ${params.emailAddress} not found. Skipping setting suspended.`);
            return;
        }
        if (email.priority > 1) {
            this.logger.info(
                `Priority of email address ${params.emailAddress} is not 0 or 1. Skipping setting suspended`,
            );
            return;
        }

        email.setStatus(EmailAddressStatusEnum.SUSPENDED);
        email.markedForCron = new Date(Date.now() + 8.64e7 * 90);
        await this.emailAddressRepo.save(email);
    }
}
