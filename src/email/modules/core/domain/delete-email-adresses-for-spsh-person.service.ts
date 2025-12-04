import { Injectable } from '@nestjs/common';
import { EmailAddressRepo } from '../persistence/email-address.repo';
import { EmailAddress } from './email-address';
import { EmailAddressStatusEnum } from '../persistence/email-address-status.entity';
import { OxService } from '../../ox/domain/ox.service';
import { OXUserID } from '../../../../shared/types/ox-ids.types';
import { OxSendService } from '../../ox/domain/ox-send.service';
import { LdapClientService } from '../../ldap/domain/ldap-client.service';

@Injectable()
export class DeleteEmailsAddressesForSpshPersonService {
    public constructor(
        private readonly emailAddressRepo: EmailAddressRepo,
        private readonly oxService: OxService,
        private readonly oxSendService: OxSendService,
        private readonly ldapClientService: LdapClientService,
    ) {}
    public async deleteEmailAddressesForSpshPerson(spshPersonId: string): Promise<void> {
        const addressesWithStatuses: EmailAddress<true>[] =
            await this.emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(spshPersonId);
        addressesWithStatuses.forEach((a: EmailAddress<true>) => a.setStatus(EmailAddressStatusEnum.TO_BE_DELETED));

        if (addressesWithStatuses.length === 0) {
            return; //TODO: ERROR HANDLING
        }
        //TODO: SAVE ALL --> Waiting for 3012 dto be ready

        const oxUserCounter: OXUserID | undefined = addressesWithStatuses.at(0)?.oxUserCounter;
        const externalId: string | undefined = addressesWithStatuses.at(0)?.externalId;
        const domain: string | undefined = addressesWithStatuses.at(0)?.getDomain();
        if (oxUserCounter) {
            await this.oxService.removeOxUserFromAllItsOxGroups(oxUserCounter);
            await this.oxSendService.send(this.oxService.createDeleteUserAction(oxUserCounter));
        } else {
            //LOGGING
        }
        if (externalId && domain) {
            await this.ldapClientService.deletePerson(externalId, domain);
        } else {
            //LOGGING
        }
    }
}
