import { Injectable } from '@nestjs/common';
import { EmailAddressRepo } from '../persistence/email-address.repo';
import { EmailAddress } from './email-address';
import { EmailAddressStatusEnum } from '../persistence/email-address-status.entity';
import { OxService } from '../../ox/domain/ox.service';
import { OXUserID } from '../../../../shared/types/ox-ids.types';
import { OxSendService } from '../../ox/domain/ox-send.service';
import { LdapClientService } from '../../ldap/domain/ldap-client.service';
import { ClassLogger } from '../../../../core/logging/class-logger';

@Injectable()
export class DeleteEmailsAddressesForSpshPersonService {
    public constructor(
        private readonly emailAddressRepo: EmailAddressRepo,
        private readonly oxService: OxService,
        private readonly oxSendService: OxSendService,
        private readonly logger: ClassLogger,
        private readonly ldapClientService: LdapClientService,
    ) {}
    public async deleteEmailAddressesForSpshPerson(params: { spshPersonId: string }): Promise<void> {
        const addresses: EmailAddress<true>[] = await this.emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
            params.spshPersonId,
        );

        if (addresses.length === 0) {
            this.logger.info(`No email addresses found for spshPerson ${params.spshPersonId}. Skipping deletion.`);
            return;
        }
        addresses.forEach((a: EmailAddress<true>) => a.setStatus(EmailAddressStatusEnum.TO_BE_DELETED));
        await Promise.all(addresses.map((a: EmailAddress<true>) => this.emailAddressRepo.save(a)));

        const oxUserCounter: OXUserID | undefined = addresses.at(0)?.oxUserCounter;
        const externalId: string | undefined = addresses.at(0)?.externalId;
        const domain: string | undefined = addresses.at(0)?.getDomain();
        if (oxUserCounter) {
            await this.oxService.removeOxUserFromAllItsOxGroups(oxUserCounter);
            this.logger.info(
                `Successfully removed for spshPerson ${params.spshPersonId} the Ox user ${oxUserCounter} from all its Ox groups`,
            );
            await this.oxSendService.send(this.oxService.createDeleteUserAction(oxUserCounter));
            this.logger.info(
                `Successfully deleted for spshPerson ${params.spshPersonId} the corresponding Ox user ${oxUserCounter}.`,
            );
        } else {
            this.logger.warning(
                `No oxUserCounter found for spshPerson ${params.spshPersonId} when deleting email addresses. Skipping Ox deletion`,
            );
        }
        if (externalId && domain) {
            await this.ldapClientService.deletePerson(externalId, domain);
            this.logger.info(
                `Successfully deleted for spshPerson ${params.spshPersonId} the LDAP user with uid: ${externalId} in domain ${domain}.`,
            );
        } else {
            this.logger.warning(
                `No externalId or domain found for spshPerson ${params.spshPersonId} when deleting email addresses. Skipping LDAP deletion`,
            );
        }
    }
}
