import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { FindEmailAddressBySpshPersonIdParams } from '../api/dtos/params/find-email-address-by-spsh-person-id.params.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { AddressWithStatusesDto } from '../api/dtos/address-with-statuses/address-with-statuses.dto.js';

@Injectable()
export class GetEmailAddressForSpshPersonService {
    public constructor(
        private readonly emailAddressRepo: EmailAddressRepo,
        private readonly logger: ClassLogger,
    ) {}

    public async getEmailAddressWithStatusForSpshPerson(
        params: FindEmailAddressBySpshPersonIdParams,
    ): Promise<AddressWithStatusesDto[]> {
        const addressesWithStatuses: AddressWithStatusesDto[] =
            await this.emailAddressRepo.findAllEmailAddressesWithStatusesBySpshPersonId(params.spshPersonId);

        if (addressesWithStatuses.length > 0) {
            this.logger.info(`Person with id ${params.spshPersonId} has email addresses assigned.`);
            return addressesWithStatuses;
        }
        return [];
    }
}
