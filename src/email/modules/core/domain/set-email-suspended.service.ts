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

    public async setEmailsSuspended(params: { spshPersonId: string }): Promise<void> {
        this.logger.info(`Received request to set email addresses to suspended for spshPerson ${params.spshPersonId}.`);
        const addresses: EmailAddress<true>[] = await this.emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
            params.spshPersonId,
        );

        if (addresses.length === 0) {
            this.logger.info(
                `No email addresses found for spshPerson ${params.spshPersonId}. Skipping setting suspended.`,
            );
            return;
        }
        const eligibleAddresses: EmailAddress<true>[] = addresses.filter((a: EmailAddress<true>) => {
            if (a.priority > 1) {
                this.logger.info(`Priority of email address ${a.address} is not 0 or 1. Skipping setting suspended`);
                return false;
            }
            return true;
        });
        eligibleAddresses.forEach((a: EmailAddress<true>) => {
            a.setStatus(EmailAddressStatusEnum.SUSPENDED);
            a.markedForCron = new Date(Date.now() + 8.64e7 * 90);
        });
        await Promise.all(addresses.map((a: EmailAddress<true>) => this.emailAddressRepo.save(a)));
    }
}
