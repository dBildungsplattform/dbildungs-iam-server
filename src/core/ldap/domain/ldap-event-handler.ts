import { Injectable } from '@nestjs/common';
import { SchuleCreatedEvent } from '../../../shared/events/schule-created.event.js';
import { EventHandler } from '../../eventbus/decorators/event-handler.decorator.js';
import { LdapClientService, PersonData } from './ldap-client.service.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { RollenArt } from '../../../modules/rolle/domain/rolle.enums.js';
import { SchuleDeletedEvent } from '../../../shared/events/schule-deleted.event.js';
import {
    PersonenkontextUpdatedData,
    PersonenkontextUpdatedEvent,
} from '../../../shared/events/personenkontext-updated.event.js';

@Injectable()
export class LdapEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly ldapClientService: LdapClientService,
    ) {}

    @EventHandler(SchuleCreatedEvent)
    public async handleSchuleCreatedEvent(event: SchuleCreatedEvent): Promise<void> {
        this.logger.info(`Received SchuleCreatedEvent, organisationId:${event.organisationId}`);

        if (!event.kennung) {
            return this.logger.error('Schule has no kennung. Aborting.');
        }
        this.logger.info(`Kennung of organisation is:${event.kennung}`);

        this.logger.info(`Call LdapClientService because ${event.name} type is SCHULE`);
        const creationResult: Result<void> = await this.ldapClientService.createOrganisation(event.kennung);
        if (!creationResult.ok) {
            this.logger.error(creationResult.error.message);
        }
    }

    @EventHandler(SchuleDeletedEvent)
    public async handleSchuleDeletedEvent(event: SchuleDeletedEvent): Promise<void> {
        this.logger.info(`Received SchuleDeletedEvent, organisationId:${event.organisationId}`);

        if (!event.kennung) {
            return this.logger.error('Schule has no kennung. Aborting.');
        }
        this.logger.info(`Kennung of organisation is:${event.kennung}`);
        this.logger.info(`Call LdapClientService because ${event.name} type is SCHULE`);
        const creationResult: Result<void> = await this.ldapClientService.deleteOrganisation({
            kennung: event.kennung,
        });
        if (!creationResult.ok) {
            this.logger.error(creationResult.error.message);
        }
    }

    @EventHandler(PersonenkontextUpdatedEvent)
    public async handlePersonenkontextUpdatedEvent(event: PersonenkontextUpdatedEvent): Promise<void> {
        this.logger.info(
            `Received PersonenkontextCreatedEvent, personId:${event.person.id}, new personenkontexte: ${event.newKontexte.length}, deleted personenkontexte: ${event.removedKontexte.length}`,
        );

        // Delete all removed personenkontexte if rollenart === LEHR
        await Promise.allSettled(
            event.removedKontexte
                .filter((pk: PersonenkontextUpdatedData) => pk.rolle === RollenArt.LEHR)
                .map(async (pk: PersonenkontextUpdatedData) => {
                    this.logger.info(`Call LdapClientService because rollenArt is LEHR`);
                    const deletionResult: Result<PersonData> = await this.ldapClientService.deleteLehrer(event.person, {
                        kennung: pk.orgaKennung,
                    });
                    if (!deletionResult.ok) {
                        this.logger.error(deletionResult.error.message);
                    }
                }),
        );

        // Create personenkontexte if rollenart === LEHR
        await Promise.allSettled(
            event.newKontexte
                .filter((pk: PersonenkontextUpdatedData) => pk.rolle === RollenArt.LEHR)
                .map(async (pk: PersonenkontextUpdatedData) => {
                    this.logger.info(`Call LdapClientService because rollenArt is LEHR`);
                    const creationResult: Result<PersonData> = await this.ldapClientService.createLehrer(event.person, {
                        kennung: pk.orgaKennung,
                    });
                    if (!creationResult.ok) {
                        this.logger.error(creationResult.error.message);
                    }
                }),
        );
    }
}
