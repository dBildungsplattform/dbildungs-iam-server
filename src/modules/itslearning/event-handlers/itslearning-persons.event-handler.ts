import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mutex } from 'async-mutex';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ItsLearningConfig, ServerConfig } from '../../../shared/config/index.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { OxUserChangedEvent } from '../../../shared/events/ox/ox-user-changed.event.js';
import { PersonRenamedEvent } from '../../../shared/events/person-renamed-event.js';
import {
    PersonenkontextUpdatedData,
    PersonenkontextUpdatedEvent,
    PersonenkontextUpdatedPersonData,
} from '../../../shared/events/personenkontext-updated.event.js';
import { OrganisationID, PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { ServiceProviderSystem } from '../../service-provider/domain/service-provider.enum.js';
import { PersonResponse } from '../actions/read-person.action.js';
import { ItslearningMembershipRepo } from '../repo/itslearning-membership.repo.js';
import { ItslearningPersonRepo } from '../repo/itslearning-person.repo.js';
import { determineHighestRollenart, rollenartToIMSESInstitutionRole } from '../repo/role-utils.js';
import { IMSESInstitutionRoleType } from '../types/role.enum.js';
import { KafkaEventHandler } from '../../../core/eventbus/decorators/kafka-event-handler.decorator.js';
import { KafkaPersonRenamedEvent } from '../../../shared/events/kafka-person-renamed-event.js';
import { KafkaPersonenkontextUpdatedEvent } from '../../../shared/events/kafka-personenkontext-updated.event.js';
import { EnsureRequestContext, EntityManager } from '@mikro-orm/core';
import { KafkaOxUserChangedEvent } from '../../../shared/events/ox/kafka-ox-user-changed.event.js';

@Injectable()
export class ItsLearningPersonsEventHandler {
    // Mutex to run updates
    private readonly personUpdateMutex: Mutex = new Mutex();

    public ENABLED: boolean;

    public constructor(
        private readonly logger: ClassLogger,
        private readonly itslearningPersonRepo: ItslearningPersonRepo,
        private readonly itslearningMembershipRepo: ItslearningMembershipRepo,
        configService: ConfigService<ServerConfig>,
        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
    ) {
        const itsLearningConfig: ItsLearningConfig = configService.getOrThrow<ItsLearningConfig>('ITSLEARNING');

        this.ENABLED = itsLearningConfig.ENABLED;
    }

    @EventHandler(PersonRenamedEvent)
    @KafkaEventHandler(KafkaPersonRenamedEvent)
    @EnsureRequestContext()
    public async personRenamedEventHandler(event: PersonRenamedEvent | KafkaPersonRenamedEvent): Promise<void> {
        await this.personUpdateMutex.runExclusive(async () => {
            this.logger.info(`[EventID: ${event.eventID}] Received PersonRenamedEvent, ${event.personId}`);

            if (!this.ENABLED) {
                return this.logger.info(`[EventID: ${event.eventID}] Not enabled, ignoring event.`);
            }

            if (!event.username) {
                return this.logger.error(
                    `[EventID: ${event.eventID}] Person with ID ${event.personId} has no username!`,
                );
            }

            const readPersonResult: Option<PersonResponse> = await this.itslearningPersonRepo.readPerson(
                event.personId,
                `${event.eventID}-PERSON-EXISTS-CHECK`,
            );

            if (!readPersonResult) {
                return this.logger.info(
                    `[EventID: ${event.eventID}] Person with ID ${event.personId} is not in itslearning, ignoring.`,
                );
            }

            const updatePersonError: Option<DomainError> = await this.itslearningPersonRepo.createOrUpdatePerson(
                {
                    id: event.personId,
                    firstName: event.vorname,
                    lastName: event.familienname,
                    username: event.username,
                    institutionRoleType: readPersonResult.institutionRole,
                },
                `${event.eventID}-PERSON-RENAMED-UPDATE`,
            );

            if (updatePersonError) {
                return this.logger.error(
                    `[EventID: ${event.eventID}] Person with ID ${event.personId} could not be updated in itsLearning!`,
                );
            }

            this.logger.info(`[EventID: ${event.eventID}] Person with ID ${event.personId} updated in itsLearning!`);
        });
    }

    @KafkaEventHandler(KafkaOxUserChangedEvent)
    @EventHandler(OxUserChangedEvent)
    @EnsureRequestContext()
    public async oxUserChangedEventHandler(event: OxUserChangedEvent): Promise<void> {
        if (!this.ENABLED) {
            return this.logger.info(`[EventID: ${event.eventID}] Not enabled, ignoring email update.`);
        }

        await this.personUpdateMutex.runExclusive(async () => {
            this.logger.info(`[EventID: ${event.eventID}] Received OxUserChangedEvent, ${event.personId}`);

            const updateError: Option<DomainError> = await this.itslearningPersonRepo.updateEmail(
                event.personId,
                event.primaryEmail,
                `${event.eventID}-EMAIL-UPDATE`,
            );

            if (updateError) {
                this.logger.error(
                    `[EventID: ${event.eventID}] Could not update E-Mail for person with ID ${event.personId}!`,
                );
            } else {
                this.logger.info(`[EventID: ${event.eventID}] Updated E-Mail for person with ID ${event.personId}!`);
            }
        });
    }

    @KafkaEventHandler(KafkaPersonenkontextUpdatedEvent)
    @EventHandler(PersonenkontextUpdatedEvent)
    @EnsureRequestContext()
    public async updatePersonenkontexteEventHandler(
        event: PersonenkontextUpdatedEvent | KafkaPersonenkontextUpdatedEvent,
    ): Promise<void> {
        await this.personUpdateMutex.runExclusive(async () => {
            this.logger.info(
                `[EventID: ${event.eventID}] Received PersonenkontextUpdatedEvent, ${event.person.id}, ${event.person.username}`,
            );

            if (!this.ENABLED) {
                return this.logger.info(`[EventID: ${event.eventID}] Not enabled, ignoring event.`);
            }

            // Collect all itslearning-orgas
            const schoolsWithItslearning: Set<OrganisationID> = new Set(
                event.currentKontexte
                    .filter((pk: PersonenkontextUpdatedData) => pk.isItslearningOrga)
                    .map((pk: PersonenkontextUpdatedData) => pk.orgaId),
            );

            // Find all removed or current kontexte that have itslearning
            const [currentKontexte]: [PersonenkontextUpdatedData[]] = this.filterRelevantKontexte(
                schoolsWithItslearning,
                event.currentKontexte,
            );

            if (currentKontexte.length > 0) {
                // Person should have itslearning, create/update them as necessary
                await this.updatePerson(event.person, currentKontexte, `${event.eventID}-UPDATE-PERSON`);

                // Synchronize memberships
                await this.updateMemberships(event.person.id, currentKontexte, `${event.eventID}-UPDATE-MEMBERSHIPS`);
            } else {
                // Delete person
                await this.deletePerson(event.person.id, `${event.eventID}-DELETE-PERSON`);
            }
        });
    }

    public async updateMemberships(
        personId: PersonID,
        currentKontexte: PersonenkontextUpdatedData[],
        eventID: string,
    ): Promise<void> {
        const setMembershipsResult: Result<unknown, DomainError> = await this.itslearningMembershipRepo.setMemberships(
            personId,
            currentKontexte.map((pk: PersonenkontextUpdatedData) => ({ organisationId: pk.orgaId, role: pk.rolle })),
            eventID,
        );

        if (!setMembershipsResult.ok) {
            this.logger.error(
                `[EventID: ${eventID}] Could not set ${currentKontexte.length} memberships for person ${personId}`,
                setMembershipsResult.error,
            );
        } else {
            this.logger.info(`[EventID: ${eventID}] Set ${currentKontexte.length} memberships for person ${personId}`);
        }
    }

    /**
     * Updates the person based on the current personenkontexte
     */
    public async updatePerson(
        person: PersonenkontextUpdatedPersonData,
        currentPersonenkontexte: PersonenkontextUpdatedData[],
        eventID: string,
    ): Promise<void> {
        if (!person.username) {
            return this.logger.error(`[EventID: ${eventID}] Person with ID ${person.id} has no username!`);
        }

        const targetRole: IMSESInstitutionRoleType = rollenartToIMSESInstitutionRole(
            determineHighestRollenart(currentPersonenkontexte.map((pk: PersonenkontextUpdatedData) => pk.rolle)),
        );

        const createError: Option<DomainError> = await this.itslearningPersonRepo.createOrUpdatePerson(
            {
                id: person.id,
                firstName: person.vorname,
                lastName: person.familienname,
                username: person.username,
                institutionRoleType: targetRole,
                email: person.email,
            },
            eventID,
        );

        if (createError) {
            return this.logger.error(
                `[EventID: ${eventID}] Person with ID ${person.id} could not be sent to itsLearning! Error: ${createError.message}`,
            );
        }

        return this.logger.info(`[EventID: ${eventID}] Person with ID ${person.id} created in itsLearning!`);
    }

    /**
     * Delete this person in itslearning
     */
    public async deletePerson(personID: PersonID, eventID: string): Promise<void> {
        const deleteError: Option<DomainError> = await this.itslearningPersonRepo.deletePerson(personID, eventID);

        if (!deleteError) {
            this.logger.info(`[EventID: ${eventID}] Person with ID ${personID} deleted.`);
        } else {
            this.logger.error(`[EventID: ${eventID}] Could not delete person with ID ${personID} from itsLearning.`);
        }
    }

    private filterRelevantKontexte<T extends [...PersonenkontextUpdatedData[][]]>(
        schoolsWithItslearning: Set<OrganisationID>,
        ...kontexte: T
    ): [...T] {
        // Only keep personenkontexte, that are at itslearning organisations and have a serviceprovider with itslearning-system
        const filteredKontexte: [...T] = kontexte.map((pks: PersonenkontextUpdatedData[]) =>
            pks.filter((pk: PersonenkontextUpdatedData) => {
                if (pk.orgaTyp === OrganisationsTyp.SCHULE) {
                    if (!pk.isItslearningOrga) {
                        return false;
                    }
                } else if (pk.orgaTyp === OrganisationsTyp.KLASSE) {
                    if (!pk.parentOrgaId || !schoolsWithItslearning.has(pk.parentOrgaId)) {
                        return false;
                    }
                } else {
                    return false;
                }

                return pk.serviceProviderExternalSystems.includes(ServiceProviderSystem.ITSLEARNING);
            }),
        ) as [...T];

        return filteredKontexte;
    }
}
