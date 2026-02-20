import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { EmailAddressRepo } from '../persistence/email-address.repo.js';
import { EmailAddress } from './email-address.js';
import { DeleteEmailsAddressesForSpshPersonService } from './delete-email-adresses-for-spsh-person.service.js';
import { EmailAddressStatusEnum } from '../persistence/email-address-status.entity.js';
import { OxService } from '../../ox/domain/ox.service.js';
import { OxSendService } from '../../ox/domain/ox-send.service.js';
import { DomainError } from '../../../../shared/error/domain.error.js';
import { OXUserID } from '../../../../shared/types/ox-ids.types.js';
import { LdapClientService } from '../../ldap/domain/ldap-client.service.js';

@Injectable()
export class CronDeleteEmailsAddressesService {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailAddressRepo: EmailAddressRepo,
        private readonly deleteEmailsAddressesForSpshPersonService: DeleteEmailsAddressesForSpshPersonService,
        private readonly oxService: OxService,
        private readonly oxSendService: OxSendService,
        private readonly ldapClientService: LdapClientService,
    ) {}
    public async deleteEmailAddresses(): Promise<void> {
        const markedForCron: Date = new Date();
        this.logger.info(`Starting cron.deleteEmailAddresses for markedForCron: ${markedForCron.toISOString()}`);

        const nrOfDeletedPrioGte2EmailAddresses: number =
            await this.emailAddressRepo.deleteAllMarkedForCronSameOrEarlierDayWithPriorityGte2(markedForCron);
        this.logger.info(`Successfully Removed: ${nrOfDeletedPrioGte2EmailAddresses} Emails with Prio >= 2 from DB`);

        //At this Point for the Day Only Emails with marked for cron and prio = 0 or prio = 1 exist
        const releveantSpshPersonIds: string[] =
            await this.emailAddressRepo.findDistinctSpshPersonIdsSameOrEarlierThanMarkedForCronAndPrioLte1(
                markedForCron,
            );

        for (const spshPersonId of releveantSpshPersonIds) {
            this.logger.info(`Processing Emails with Prio < 2 for spshPerson ${spshPersonId}`);

            // eslint-disable-next-line no-await-in-loop
            await this.deleteAffectedPrioLte1EmailsForPerson(spshPersonId, markedForCron);
        }

        this.logger.info(`Finished cron.deleteEmailAddresses for markedForCron: ${markedForCron.toISOString()}`);
    }

    /**
     * Deletes all email addresses of a given SPSH person
     * that are marked for cron execution on or before the provided date, but only
     * for addresses with priority **0 or 1**. Priority ≥ 2 are already removed
     * earlier in the cron flow in method deleteEmailAddresses.
     */
    private async deleteAffectedPrioLte1EmailsForPerson(spshPersonId: string, markedForCron: Date): Promise<void> {
        const allEmailsForPerson: EmailAddress<true>[] =
            await this.emailAddressRepo.findBySpshPersonIdSortedByPriorityAsc(spshPersonId);
        const emailsToDeleteToday: EmailAddress<true>[] = allEmailsForPerson.filter(
            (email: EmailAddress<true>) => email.markedForCron != null && email.markedForCron <= markedForCron,
        );

        if (emailsToDeleteToday.length === allEmailsForPerson.length) {
            this.logger.info(
                `Primary (Prio 1) and Alternative (Prio 2) Emails for person ${spshPersonId} will be deleted.`,
            );
            await this.deleteEmailsAddressesForSpshPersonService.deleteEmailAddressesForSpshPerson({ spshPersonId });
            return;
        }
        this.logger.info(`Only The Alternative Email (Prio 2) for person ${spshPersonId} will be deleted.`);
        const emailAlternativeTemp: EmailAddress<true> | undefined = emailsToDeleteToday.at(0);
        if (emailsToDeleteToday.length !== 1 || !emailAlternativeTemp || emailAlternativeTemp.priority !== 1) {
            this.logger.error(
                'When not the Entire Person is deleted, the only remaining email to be deleted must be the Alternative Email (Prio 2)',
            );
            return;
        }
        const prio1ToDelete: EmailAddress<true> = emailAlternativeTemp;
        const prio0ToKeep: EmailAddress<true> | undefined = allEmailsForPerson.find(
            (e: EmailAddress<true>) => e.priority === 0,
        );
        if (!prio0ToKeep) {
            this.logger.error('When not the Entire Person is deleted, a Primary Email (Prio 1) must remain existent');
            return;
        }

        prio1ToDelete.setStatus(EmailAddressStatusEnum.TO_BE_DELETED);
        await this.emailAddressRepo.save(prio1ToDelete);

        const externalId: string = prio1ToDelete.externalId;
        const oxUserCounter: OXUserID | undefined = prio1ToDelete.oxUserCounter;
        const domain: string | undefined = prio1ToDelete.getDomain();

        let isCanDeletePrio1FromDb: boolean = true;

        if (oxUserCounter) {
            const changeResult: Result<void, DomainError> = await this.oxSendService.send(
                this.oxService.createChangeUserAction(
                    oxUserCounter,
                    undefined,
                    [prio0ToKeep.address],
                    undefined,
                    undefined,
                    undefined,
                    prio0ToKeep.address,
                    prio0ToKeep.address,
                ),
            );

            if (!changeResult.ok) {
                this.logger.logUnknownAsError(`Could not update in ox`, changeResult.error);
                isCanDeletePrio1FromDb = false;
            } else {
                this.logger.info(`Successfully updated userdata in ox for person ${spshPersonId}`);
            }
        } else {
            isCanDeletePrio1FromDb = false;
            this.logger.error(
                `No oxUserCounter found for spshPerson ${spshPersonId} when deleting email addresses. Skipping Ox update`,
            );
        }

        if (domain) {
            const changeResult: Result<string> = await this.ldapClientService.updatePersonEmails(
                externalId,
                domain,
                prio0ToKeep.address,
                undefined,
            );

            if (!changeResult.ok) {
                this.logger.logUnknownAsError(`Could not update in ldap`, changeResult.error);
                isCanDeletePrio1FromDb = false;
            } else {
                this.logger.info(`Successfully updated userdata in ldap for person ${spshPersonId}`);
            }
        } else {
            isCanDeletePrio1FromDb = false;
            this.logger.error(
                `No domain found for spshPerson ${spshPersonId} when deleting email addresses. Skipping LDAP deletion`,
            );
        }

        if (isCanDeletePrio1FromDb) {
            await this.emailAddressRepo.delete(prio1ToDelete);
        } else {
            this.logger.error(
                `skipping removal of ${prio1ToDelete.address} from DB for person ${spshPersonId}, because not all external representation could be deleted`,
            );
        }
    }
}
