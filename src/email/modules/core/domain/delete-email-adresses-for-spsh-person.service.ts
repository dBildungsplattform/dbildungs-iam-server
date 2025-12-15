import { Injectable } from '@nestjs/common';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { EmailAddress } from './email-address.js';
import { EmailAddressStatusEnum } from '../persistence/email-address-status.entity.js';
import { OxService } from '../../ox/domain/ox.service.js';
import { OXUserID } from '../../../../shared/types/ox-ids.types.js';
import { LdapClientService } from '../../ldap/domain/ldap-client.service.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { OxNoSuchUserError } from '../../ox/error/ox-no-such-user.error.js';

@Injectable()
export class DeleteEmailsAddressesForSpshPersonService {
    public constructor(
        private readonly emailAddressRepo: EmailAddressRepo,
        private readonly oxService: OxService,
        private readonly logger: ClassLogger,
        private readonly ldapClientService: LdapClientService,
    ) {}
    public async deleteEmailAddressesForSpshPerson(params: { spshPersonId: string }): Promise<void> {
        this.logger.info(`Received request to delete all email addresses for spshPerson ${params.spshPersonId}.`);
        const addresses: EmailAddress<true>[] = await this.emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(
            params.spshPersonId,
        );

        if (addresses.length === 0) {
            this.logger.info(`No email addresses found for spshPerson ${params.spshPersonId}. Skipping deletion.`);
            return;
        }
        addresses.forEach((a: EmailAddress<true>) => {
            a.setStatus(EmailAddressStatusEnum.TO_BE_DELETED);
            a.markedForCron = new Date();
        });
        await Promise.all(addresses.map((a: EmailAddress<true>) => this.emailAddressRepo.save(a)));

        //If any of the external deletion operations fail, we keep the email addresses in DB with status TO_BE_DELETED for retry by the cronjob
        let canDbDeleteAllAdresses: boolean = true;

        const oxUserCounter: OXUserID | undefined = addresses.find(
            (a: EmailAddress<true>) => a.oxUserCounter,
        )?.oxUserCounter;
        const externalId: string | undefined = addresses.find((a: EmailAddress<true>) => a.externalId)?.externalId;
        const domain: string | undefined = addresses.find((a: EmailAddress<true>) => a.getDomain())?.getDomain();
        if (oxUserCounter) {
            //Deleting the Group Relations extra is not necessary as Ox deletes them automatically when deleting the user
            const deleteUserResult: Result<void, Error> = await this.oxService.deleteUser(oxUserCounter);
            if (deleteUserResult.ok) {
                this.logger.info(
                    `Successfully deleted for spshPerson ${params.spshPersonId} the corresponding Ox user ${oxUserCounter}.`,
                );
            } else if (deleteUserResult.error instanceof OxNoSuchUserError) {
                this.logger.info(
                    `User for spshPerson ${params.spshPersonId} with Ox user id ${oxUserCounter} does not exist in Ox anymore. Continuing deletion process.`,
                );
            } else {
                canDbDeleteAllAdresses = false;
            }
        } else {
            this.logger.warning(
                `No oxUserCounter found for spshPerson ${params.spshPersonId} when deleting email addresses. Skipping Ox deletion`,
            );
        }
        if (externalId && domain) {
            const deleteLdapPersonResult: Result<void, Error> = await this.ldapClientService.deletePerson(
                externalId,
                domain,
            );
            if (!deleteLdapPersonResult.ok) {
                canDbDeleteAllAdresses = false;
            } else {
                this.logger.info(
                    `Successfully deleted for spshPerson ${params.spshPersonId} the LDAP user with uid: ${externalId} in domain ${domain}.`,
                );
            }
        } else {
            this.logger.warning(
                `No externalId or domain found for spshPerson ${params.spshPersonId} when deleting email addresses. Skipping LDAP deletion`,
            );
        }
        if (canDbDeleteAllAdresses) {
            await Promise.all(addresses.map((a: EmailAddress<true>) => this.emailAddressRepo.delete(a)));
            this.logger.info(`Successfully deleted all email addresses for spshPerson ${params.spshPersonId} from DB.`);
        } else {
            this.logger.warning(
                `Could not delete all external representations for spshPerson ${params.spshPersonId}. Keeping email addresses in DB with status TO_BE_DELETED for retry.`,
            );
        }
    }
}
