import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { OxEmailAddressDeletedEvent } from '../../../shared/events/ox-email-address-deleted.event.js';
import { LdapEmailAddressDeletedEvent } from '../../../shared/events/ldap-email-address-deleted.event.js';
import { EmailAddress, EmailAddressStatus } from '../domain/email-address.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { PersonReferrer } from '../../../shared/types/aggregate-ids.types.js';

@Injectable()
export class EmailAddressDeletionHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailRepo: EmailRepo,
        //private readonly eventService: EventService,
    ) {}

    @EventHandler(LdapEmailAddressDeletedEvent)
    // eslint-disable-next-line @typescript-eslint/require-await
    public async handleLdapEmailAddressDeletedEvent(event: LdapEmailAddressDeletedEvent): Promise<void> {
        this.logger.info(
            `Received LdapEmailAddressDeletedEvent, personId:${event.personId}, referrer:${event.username}, address:${event.address}`,
        );

        const emailAddress: Option<EmailAddress<true>> = await this.emailRepo.findByAddress(event.address);
        if (!emailAddress) {
            return this.logger.error(
                `Could not process LdapEmailAddressDeletedEvent, EmailAddress could not be fetched by address, personId:${event.personId}, referrer:${event.username}, address:${event.address}`,
            );
        }
        const newStatus: EmailAddressStatus = emailAddress.deletedFromLdap();
        await this.processNewStatus(newStatus, emailAddress, event.username);
    }

    @EventHandler(OxEmailAddressDeletedEvent)
    // eslint-disable-next-line @typescript-eslint/require-await
    public async handleOxEmailAddressDeletedEvent(event: OxEmailAddressDeletedEvent): Promise<void> {
        this.logger.info(
            `Received OxEmailAddressDeletedEvent, personId:${event.personId}, referrer:${event.username}, oxUserId:${event.oxUserId}, address:${event.address}`,
        );

        const emailAddress: Option<EmailAddress<true>> = await this.emailRepo.findByAddress(event.address);
        if (!emailAddress) {
            return this.logger.error(
                `Could not process OxEmailAddressDeletedEvent, EmailAddress could not be fetched by address, personId:${event.personId}, referrer:${event.username}, address:${event.address}`,
            );
        }
        const newStatus: EmailAddressStatus = emailAddress.deletedFromOx();
        await this.processNewStatus(newStatus, emailAddress, event.username);
    }

    private async processNewStatus(
        newStatus: EmailAddressStatus,
        emailAddress: EmailAddress<true>,
        username: PersonReferrer,
    ): Promise<void> {
        this.logger.info(
            `New EmailAddressStatus is:${newStatus}, personId:${emailAddress.personId}, referrer:${username}, address:${emailAddress.address}`,
        );
        if (newStatus === EmailAddressStatus.DELETED) {
            await this.deleteEmailAddressInDatabase(emailAddress, username);
        } else {
            await this.saveChangedStatus(emailAddress, username);
        }
    }

    private async deleteEmailAddressInDatabase(
        emailAddress: EmailAddress<true>,
        username: PersonReferrer,
    ): Promise<void> {
        const deletionError: Option<DomainError> = await this.emailRepo.deleteById(emailAddress.id);
        if (deletionError) {
            return this.logger.error(
                `Deletion of EmailAddress failed, personId:${emailAddress.personId}, referrer:${username}, address:${emailAddress.address}`,
            );
        }

        return this.logger.info(
            `Successfully deleted EmailAddress, personId:${emailAddress.personId}, referrer:${username}, address:${emailAddress.address}`,
        );
    }

    private async saveChangedStatus(emailAddress: EmailAddress<true>, username: PersonReferrer): Promise<void> {
        const result: EmailAddress<true> | DomainError = await this.emailRepo.save(emailAddress);
        if (result instanceof DomainError) {
            return this.logger.error(
                `Failed persisting changed EmailAddressStatus:${emailAddress.status}, personId:${emailAddress.personId}, referrer:${username}, address:${emailAddress.address}`,
            );
        }

        return this.logger.info(
            `Successfully persisted changed EmailAddressStatus:${emailAddress.status}, personId:${emailAddress.personId}, referrer:${username}, address:${emailAddress.address}`,
        );
    }
}
