import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { FindEmailAddressBySpshPersonIdParams } from '../api/dtos/params/find-email-address-by-spsh-person-id.params.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { EmailAddress } from './email-address.js';

@Injectable()
export class GetEmailAddressForSpshPersonService {
    public constructor(
        private readonly emailAddressRepo: EmailAddressRepo,
        private readonly logger: ClassLogger,
    ) {}

    public async getEmailAddressWithStatusForSpshPerson(params: FindEmailAddressBySpshPersonIdParams): Promise<EmailAddress<true>[]> {
        const existingAddresses: EmailAddress<true>[] =
                    await this.emailAddressRepo.findAllEmailAddressesWithStatusesBySpshPersonId(params.spshPersonId);

        if (existingAddresses.length > 0) {
            this.logger.crit(
                `Person with id ${params.spshPersonId} has email addresses assigned.`,
            );
            return existingAddresses;
        }
        return [];
    }
}
