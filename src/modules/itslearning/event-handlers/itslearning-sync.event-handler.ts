import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { uniq } from 'lodash-es';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ItsLearningConfig, ServerConfig } from '../../../shared/config/index.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { PersonExternalSystemsSyncEvent } from '../../../shared/events/person-external-systems-sync.event.js';
import { OrganisationID, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { ServiceProviderSystem } from '../../service-provider/domain/service-provider.enum.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import {
    ItslearningMembershipRepo,
    SetMembershipParams,
    SetMembershipsResult,
} from '../repo/itslearning-membership.repo.js';
import { ItslearningPersonRepo } from '../repo/itslearning-person.repo.js';
import { determineHighestRollenart, rollenartToIMSESInstitutionRole } from '../repo/role-utils.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { KafkaEventHandler } from '../../../core/eventbus/decorators/kafka-event-handler.decorator.js';
import { KafkaPersonExternalSystemsSyncEvent } from '../../../shared/events/kafka-person-external-systems-sync.event.js';
import { EnsureRequestContext, EntityManager } from '@mikro-orm/core';

@Injectable()
export class ItsLearningSyncEventHandler {
    public ENABLED: boolean;

    public constructor(
        private readonly logger: ClassLogger,

        private readonly itslearningPersonRepo: ItslearningPersonRepo,
        private readonly itslearningMembershipRepo: ItslearningMembershipRepo,

        private readonly personRepo: PersonRepository,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepo: OrganisationRepository,
        configService: ConfigService<ServerConfig>,

        // @ts-expect-error used by EnsureRequestContext decorator
        // Although not accessed directly, MikroORM's @EnsureRequestContext() uses this.em internally
        // to create the request-bound EntityManager context. Removing it would break context creation.
        private readonly em: EntityManager,
    ) {
        const itsLearningConfig: ItsLearningConfig = configService.getOrThrow<ItsLearningConfig>('ITSLEARNING');

        this.ENABLED = itsLearningConfig.ENABLED;
    }

    @KafkaEventHandler(KafkaPersonExternalSystemsSyncEvent)
    @EventHandler(PersonExternalSystemsSyncEvent)
    @EnsureRequestContext()
    public async personExternalSystemSyncEventHandler(event: PersonExternalSystemsSyncEvent): Promise<void> {
        this.logger.info(`[EventID: ${event.eventID}] Received PersonExternalSystemsSyncEvent, ${event.personId}`);

        if (!this.ENABLED) {
            return this.logger.info(`[EventID: ${event.eventID}] Not enabled, ignoring event.`);
        }

        // Retrieve the person from the DB
        const person: Option<Person<true>> = await this.personRepo.findById(event.personId);
        if (!person) {
            return this.logger.error(
                `[EventID: ${event.eventID}] Person with ID ${event.personId} could not be found!`,
            );
        }

        // Check if person has a username
        if (!person.username) {
            return this.logger.error(`[EventID: ${event.eventID}] Person with ID ${event.personId} has no username!`);
        }

        // Get all personenkontexte for this person
        const kontexte: Personenkontext<true>[] = await this.personenkontextRepo.findByPerson(event.personId);

        // Find all rollen and organisations
        const rollenIDs: RolleID[] = uniq(kontexte.map((pk: Personenkontext<true>) => pk.rolleId));
        const organisationIDs: OrganisationID[] = uniq(kontexte.map((pk: Personenkontext<true>) => pk.organisationId));
        const [rollen, organisations]: [Map<RolleID, Rolle<true>>, Map<OrganisationID, Organisation<true>>] =
            await Promise.all([this.rolleRepo.findByIds(rollenIDs), this.organisationRepo.findByIds(organisationIDs)]);

        // Remove all rollen that do not have itslearning
        for (const [rolleId, rolle] of rollen.entries()) {
            if (
                !rolle.serviceProviderData.some(
                    (sp: ServiceProvider<true>) => sp.externalSystem === ServiceProviderSystem.ITSLEARNING,
                )
            ) {
                rollen.delete(rolleId);
            }
        }

        // Remove all organisations that do not have itslearning
        for (const [orgaId, organisation] of organisations.entries()) {
            if (organisation.typ === OrganisationsTyp.SCHULE) {
                // Only keep schools, that are enabled for itslearning
                if (!organisation.itslearningEnabled) {
                    organisations.delete(orgaId);
                }
            } else if (organisation.typ === OrganisationsTyp.KLASSE) {
                // Only keep classes, whose schools are enabled for itslearning
                const parentItslearningEnabled: boolean = !!(
                    organisation.administriertVon &&
                    organisations.get(organisation.administriertVon)?.itslearningEnabled
                );

                if (!parentItslearningEnabled) {
                    organisations.delete(orgaId);
                }
            } else {
                // We only care about schools and classes
                organisations.delete(orgaId);
            }
        }

        // Filter kontexte we care about
        const relevantKontexte: Personenkontext<true>[] = kontexte.filter(
            (pk: Personenkontext<true>) => rollen.has(pk.rolleId) && organisations.has(pk.organisationId),
        );

        // Check if the person has at least one personenkontext with the itslearning-system
        if (relevantKontexte.length > 0) {
            const targetRole: RollenArt = determineHighestRollenart(
                Array.from(rollen.values()).map((rolle: Rolle<true>) => rolle.rollenart),
            );

            // Create or update the person in itslearning
            const creationError: Option<DomainError> = await this.itslearningPersonRepo.createOrUpdatePerson(
                {
                    id: person.id,
                    firstName: person.vorname,
                    lastName: person.familienname,
                    username: person.username,
                    institutionRoleType: rollenartToIMSESInstitutionRole(targetRole),
                    email: person.email,
                },
                `${event.eventID}-SYNC-PERSON`,
            );

            if (creationError) {
                return this.logger.error(
                    `[EventID: ${event.eventID}] Could not create/update person with ID ${person.id} in itslearning!`,
                );
            }

            this.logger.info(`[EventID: ${event.eventID}] Updated person with ID ${person.id} in itslearning!`);

            // Set the memberships
            const memberships: SetMembershipParams[] = relevantKontexte.map((pk: Personenkontext<true>) => ({
                organisationId: pk.organisationId,

                // We know the map will contain the rolle, 'relevantKontexte' was already filtered
                role: rollen.get(pk.rolleId)!.rollenart,
            }));

            const setMembershipsResult: Result<SetMembershipsResult, DomainError> =
                await this.itslearningMembershipRepo.setMemberships(
                    person.id,
                    memberships,
                    `${event.eventID}-SYNC-PERSON-MEMBERSHIPS`,
                );

            if (!setMembershipsResult.ok) {
                return this.logger.error(
                    `[EventID: ${event.eventID}] Could not delete person with ID ${person.id} from itslearning!`,
                );
            }

            this.logger.info(
                `[EventID: ${event.eventID}] Created/Updated ${setMembershipsResult.value.updated} and deleted ${setMembershipsResult.value.deleted} memberships for person with ID ${person.id} to itslearning!`,
            );
        } else {
            this.logger.info(
                `[EventID: ${event.eventID}] Deleting person with ID ${person.id} from itslearning (if they exist), because they have no relevant personenkontexte!`,
            );

            // We don't have any relevant personenkontexte for this person, so we delete it
            const deleteError: Option<DomainError> = await this.itslearningPersonRepo.deletePerson(
                person.id,
                `${event.eventID}-DELETE`,
            );

            if (deleteError) {
                return this.logger.error(
                    `[EventID: ${event.eventID}] Could not delete person with ID ${person.id} from itslearning!`,
                );
            }
        }
    }
}
