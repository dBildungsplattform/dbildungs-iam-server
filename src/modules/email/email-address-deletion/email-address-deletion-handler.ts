import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { OxEmailAddressDeletedEvent } from '../../../shared/events/ox/ox-email-address-deleted.event.js';
import { LdapEmailAddressDeletedEvent } from '../../../shared/events/ldap/ldap-email-address-deleted.event.js';
import { EmailAddress, EmailAddressStatus } from '../domain/email-address.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { PersonUsername } from '../../../shared/types/aggregate-ids.types.js';
import { EmailAddressDeletedInDatabaseEvent } from '../../../shared/events/email/email-address-deleted-in-database.event.js';
import { EmailAddressDeletionService } from './email-address-deletion.service.js';

import { EnsureRequestContext, EntityManager } from '@mikro-orm/core';
import { KafkaEventHandler } from '../../../core/eventbus/decorators/kafka-event-handler.decorator.js';
import { KafkaEmailAddressDeletedInDatabaseEvent } from '../../../shared/events/email/kafka-email-address-deleted-in-database.event.js';
import { KafkaOxEmailAddressDeletedEvent } from '../../../shared/events/ox/kafka-ox-email-address-deleted.event.js';
import { KafkaLdapEmailAddressDeletedEvent } from '../../../shared/events/ldap/kafka-ldap-email-address-deleted.event.js';

@Injectable()
export class EmailAddressDeletionHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailRepo: EmailRepo,
        private readonly emailAddressDeletionService: EmailAddressDeletionService,
        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
    ) {}

    @KafkaEventHandler(KafkaLdapEmailAddressDeletedEvent)
    @EventHandler(LdapEmailAddressDeletedEvent)
    @EnsureRequestContext()
    public async handleLdapEmailAddressDeletedEvent(event: LdapEmailAddressDeletedEvent): Promise<void> {
        this.logger.info(
            `Received LdapEmailAddressDeletedEvent, personId:${event.personId}, username:${event.username}, address:${event.address}`,
        );

        const emailAddress: Option<EmailAddress<true>> = await this.emailRepo.findByAddress(event.address);
        if (!emailAddress) {
            return this.logger.info(
                `Could not process LdapEmailAddressDeletedEvent, EmailAddress could not be fetched by address, personId:${event.personId}, username:${event.username}, address:${event.address}`,
            );
        }
        const newStatus: EmailAddressStatus = emailAddress.deletedFromLdap();
        await this.processNewStatus(newStatus, emailAddress, event.username);
    }

    @KafkaEventHandler(KafkaOxEmailAddressDeletedEvent)
    @EventHandler(OxEmailAddressDeletedEvent)
    @EnsureRequestContext()
    public async handleOxEmailAddressDeletedEvent(event: OxEmailAddressDeletedEvent): Promise<void> {
        this.logger.info(
            `Received OxEmailAddressDeletedEvent, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}, address:${event.address}`,
        );

        const emailAddress: Option<EmailAddress<true>> = await this.emailRepo.findByAddress(event.address);
        if (!emailAddress) {
            return this.logger.info(
                `Could not process OxEmailAddressDeletedEvent, EmailAddress could not be fetched by address, personId:${event.personId}, username:${event.username}, address:${event.address}`,
            );
        }
        const newStatus: EmailAddressStatus = emailAddress.deletedFromOx();
        await this.processNewStatus(newStatus, emailAddress, event.username);
    }

    @KafkaEventHandler(KafkaEmailAddressDeletedInDatabaseEvent)
    @EventHandler(EmailAddressDeletedInDatabaseEvent)
    @EnsureRequestContext()
    public async handleEmailAddressDeletedInDatabaseEvent(event: EmailAddressDeletedInDatabaseEvent): Promise<void> {
        this.logger.info(
            `Received EmailAddressDeletedInDatabaseEvent, personId:${event.personId}, oxUserId:${event.oxUserId}, id:${event.emailAddressId}, status:${event.status}, address:${event.address}`,
        );

        await this.emailAddressDeletionService.checkRemainingEmailAddressesByPersonId(event.personId, event.oxUserId);
    }

    private async processNewStatus(
        newStatus: EmailAddressStatus,
        emailAddress: EmailAddress<true>,
        username: PersonUsername | undefined,
    ): Promise<void> {
        this.logger.info(
            `New EmailAddressStatus is:${newStatus}, personId:${emailAddress.personId}, username:${username}, address:${emailAddress.address}`,
        );
        if (newStatus === EmailAddressStatus.DELETED) {
            await this.deleteEmailAddressInDatabase(emailAddress, username);
        } else {
            await this.saveChangedStatus(emailAddress, username);
        }
    }

    private async deleteEmailAddressInDatabase(
        emailAddress: EmailAddress<true>,
        username: PersonUsername | undefined,
    ): Promise<void> {
        const deletionError: Option<DomainError> = await this.emailRepo.deleteById(emailAddress.id);
        if (deletionError) {
            return this.logger.error(
                `Deletion of EmailAddress failed, personId:${emailAddress.personId}, username:${username}, address:${emailAddress.address}`,
            );
        }

        return this.logger.info(
            `Successfully deleted EmailAddress, personId:${emailAddress.personId}, username:${username}, address:${emailAddress.address}`,
        );
    }

    private async saveChangedStatus(
        emailAddress: EmailAddress<true>,
        username: PersonUsername | undefined,
    ): Promise<void> {
        const result: EmailAddress<true> | DomainError = await this.emailRepo.save(emailAddress);
        if (result instanceof DomainError) {
            return this.logger.error(
                `Failed persisting changed EmailAddressStatus:${emailAddress.status}, personId:${emailAddress.personId}, username:${username}, address:${emailAddress.address}`,
            );
        }

        return this.logger.info(
            `Successfully persisted changed EmailAddressStatus:${emailAddress.status}, personId:${emailAddress.personId}, username:${username}, address:${emailAddress.address}`,
        );
    }
}
