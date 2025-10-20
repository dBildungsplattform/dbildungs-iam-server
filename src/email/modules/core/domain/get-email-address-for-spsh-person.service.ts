import { Injectable } from '@nestjs/common';
import { FindEmailAddressBySpshPersonIdParams } from '../api/dtos/params/find-email-address-by-spsh-person-id.params.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { AddressWithStatusesDescDto } from '../api/dtos/address-with-statuses/address-with-statuses-desc.dto.js';

@Injectable()
export class GetEmailAddressForSpshPersonService {
    public constructor(private readonly emailAddressRepo: EmailAddressRepo) {}

    public async getEmailAddressWithStatusForSpshPerson(
        params: FindEmailAddressBySpshPersonIdParams,
    ): Promise<AddressWithStatusesDescDto[]> {
        const addressesWithStatuses: AddressWithStatusesDescDto[] =
            await this.emailAddressRepo.findAllEmailAddressesWithStatusesDescBySpshPersonId(params.spshPersonId);
        return addressesWithStatuses;
    }
}
