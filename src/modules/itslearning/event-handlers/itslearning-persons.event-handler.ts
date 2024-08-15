import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mutex } from 'async-mutex';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ItsLearningConfig, ServerConfig } from '../../../shared/config/index.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import {
    PersonenkontextUpdatedData,
    PersonenkontextUpdatedEvent,
    PersonenkontextUpdatedPersonData,
} from '../../../shared/events/personenkontext-updated.event.js';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { CreateMembershipsAction } from '../actions/create-memberships.action.js';
import { CreatePersonAction } from '../actions/create-person.action.js';
import { DeleteMembershipsAction } from '../actions/delete-memberships.action.js';
import { DeletePersonAction } from '../actions/delete-person.action.js';
import { PersonResponse, ReadPersonAction } from '../actions/read-person.action.js';
import { ItsLearningIMSESService } from '../itslearning.service.js';
import { IMSESInstitutionRoleType, IMSESRoleType } from '../types/role.enum.js';
import { PersonenkontextDeletedEvent } from '../../../shared/events/personenkontext-deleted.event.js';

// Maps our roles to itsLearning roles
const ROLLENART_TO_ITSLEARNING_ROLE: Record<RollenArt, IMSESInstitutionRoleType> = {
    [RollenArt.EXTERN]: IMSESInstitutionRoleType.GUEST,
    [RollenArt.LERN]: IMSESInstitutionRoleType.STUDENT,
    [RollenArt.LEHR]: IMSESInstitutionRoleType.STAFF,
    [RollenArt.LEIT]: IMSESInstitutionRoleType.ADMINISTRATOR,
    [RollenArt.ORGADMIN]: IMSESInstitutionRoleType.ADMINISTRATOR,
    [RollenArt.SYSADMIN]: IMSESInstitutionRoleType.SYSTEM_ADMINISTRATOR,
};

// Maps our roles to IMS ES roles (Different from InstitutionRoleType)
const ROLLENART_TO_IMSES_ROLE: Record<RollenArt, IMSESRoleType> = {
    [RollenArt.EXTERN]: IMSESRoleType.MEMBER,
    [RollenArt.LERN]: IMSESRoleType.LEARNER,
    [RollenArt.LEHR]: IMSESRoleType.INSTRUCTOR,
    [RollenArt.LEIT]: IMSESRoleType.MANAGER,
    [RollenArt.ORGADMIN]: IMSESRoleType.ADMINISTRATOR,
    [RollenArt.SYSADMIN]: IMSESRoleType.ADMINISTRATOR,
};

// Determines order of roles.
// example: If person has both a EXTERN and a LEHR role, the LEHR role has priority
const ROLLENART_ORDER: RollenArt[] = [
    RollenArt.EXTERN,
    RollenArt.LERN,
    RollenArt.LEHR,
    RollenArt.LEIT,
    RollenArt.ORGADMIN,
    RollenArt.SYSADMIN,
];

@Injectable()
export class ItsLearningPersonsEventHandler {
    public ENABLED: boolean;

    private readonly mutex: Mutex = new Mutex();

    public constructor(
        private readonly logger: ClassLogger,
        private readonly itsLearningService: ItsLearningIMSESService,
        configService: ConfigService<ServerConfig>,
    ) {
        const itsLearningConfig: ItsLearningConfig = configService.getOrThrow<ItsLearningConfig>('ITSLEARNING');

        this.ENABLED = itsLearningConfig.ENABLED === 'true';
    }

    @EventHandler(PersonenkontextDeletedEvent)
    public async handlePersonenkontextDeletedEvent(event: PersonenkontextDeletedEvent): Promise<void> {
        this.logger.info(
            `Received PersonenkontextDeletedEvent, personId:${event.personData.id}, orgaId:${event.kontextData.orgaId}, rolleId:${event.kontextData.rolleId}`,
        );

        if (!this.ENABLED) {
            return this.logger.info('Not enabled, ignoring event.');
        }

        await this.deletePerson(event.personData.id);
    }

    @EventHandler(PersonenkontextUpdatedEvent)
    public async updatePersonenkontexteEventHandler(event: PersonenkontextUpdatedEvent): Promise<void> {
        this.logger.info(`Received PersonenkontextUpdatedEvent, ${event.person.id}`);

        if (!this.ENABLED) {
            return this.logger.info('Not enabled, ignoring event.');
        }

        const shouldDelete: boolean = await this.updatePerson(event.person, event.currentKontexte);

        await this.deleteMemberships(event.person, event.removedKontexte);

        await this.addMemberships(event.person, event.newKontexte);

        if (shouldDelete) {
            await this.deletePerson(event.person.id);
        }
    }

    /**
     * Updates the person based on the current personenkontexte
     * @returns Returns true, if the person should be deleted
     */
    public async updatePerson(
        person: PersonenkontextUpdatedPersonData,
        personenkontexte: PersonenkontextUpdatedData[],
    ): Promise<boolean> {
        // Use mutex because multiple personenkontexte can be created at once
        return this.mutex.runExclusive(async () => {
            // If no personenkontexte exist, delete the person from itsLearning
            if (personenkontexte.length === 0) {
                this.logger.info(`No Personenkontexte found for Person ${person.id}, deleting from itsLearning.`);

                return true;
            }

            const targetRole: IMSESInstitutionRoleType = this.determineItsLearningRole(personenkontexte);

            const personResult: Result<PersonResponse, DomainError> = await this.itsLearningService.send(
                new ReadPersonAction(person.id),
            );

            // If user already exists in itsLearning and has the correct role, don't send update
            if (personResult.ok && personResult.value.institutionRole === targetRole) {
                this.logger.info('Person already exists with correct role');
                return false;
            }

            if (!person.referrer) {
                this.logger.error(`Person with ID ${person.id} has no username!`);
                return false;
            }

            const createAction: CreatePersonAction = new CreatePersonAction({
                id: person.id,
                firstName: person.vorname,
                lastName: person.familienname,
                username: person.referrer,
                institutionRoleType: targetRole,
            });

            const createResult: Result<void, DomainError> = await this.itsLearningService.send(createAction);

            if (!createResult.ok) {
                this.logger.error(`Person with ID ${person.id} could not be sent to itsLearning!`);
                return false;
            }

            this.logger.info(`Person with ID ${person.id} created in itsLearning!`);
            return false;
        });
    }

    public async deleteMemberships(
        person: PersonenkontextUpdatedPersonData,
        deletedPersonenkontexte: PersonenkontextUpdatedData[],
    ): Promise<void> {
        if (deletedPersonenkontexte.length === 0) {
            return;
        }

        // Use mutex because multiple personenkontexte can be deleted at once
        return this.mutex.runExclusive(async () => {
            const createAction: DeleteMembershipsAction = new DeleteMembershipsAction(
                deletedPersonenkontexte.map((pk: PersonenkontextUpdatedData) => pk.id),
            );

            const deleteResult: Result<void, DomainError> = await this.itsLearningService.send(createAction);

            if (!deleteResult.ok) {
                return this.logger.error(
                    `Error while deleting ${deletedPersonenkontexte.length} memberships for person ${person.id}!`,
                );
            }

            return this.logger.info(`Deleted ${deletedPersonenkontexte.length} memberships for person ${person.id}!`);
        });
    }

    public async addMemberships(
        person: PersonenkontextUpdatedPersonData,
        newPersonenkontexte: PersonenkontextUpdatedData[],
    ): Promise<void> {
        if (newPersonenkontexte.length === 0) {
            return;
        }

        // Use mutex because multiple personenkontexte can be created at once
        return this.mutex.runExclusive(async () => {
            const createAction: CreateMembershipsAction = new CreateMembershipsAction(
                newPersonenkontexte.map((pk: PersonenkontextUpdatedData) => ({
                    id: pk.id,
                    personId: person.id,
                    groupId: pk.orgaId,
                    roleType: ROLLENART_TO_IMSES_ROLE[pk.rolle],
                })),
            );

            const createResult: Result<void, DomainError> = await this.itsLearningService.send(createAction);

            if (!createResult.ok) {
                return this.logger.error(
                    `Error while creating ${newPersonenkontexte.length} memberships for person ${person.id}!`,
                );
            }

            return this.logger.info(`Created ${newPersonenkontexte.length} memberships for person ${person.id}!`);
        });
    }

    public async deletePerson(personID: PersonID): Promise<void> {
        return this.mutex.runExclusive(async () => {
            const deleteResult: Result<void, DomainError> = await this.itsLearningService.send(
                new DeletePersonAction(personID),
            );

            if (deleteResult.ok) {
                this.logger.info(`Person deleted.`);
            } else {
                this.logger.error(`Could not delete person from itsLearning.`);
            }
        });
    }

    /**
     * Determines which role the user should have in itsLearning (User needs to have a primary role)
     * @param personenkontexte
     * @returns
     */
    private determineItsLearningRole(personenkontexte: PersonenkontextUpdatedData[]): IMSESInstitutionRoleType {
        let highestRole: number = 0;

        for (const { rolle } of personenkontexte) {
            highestRole = Math.max(highestRole, ROLLENART_ORDER.indexOf(rolle));
        }

        // Null assertion is valid here, highestRole can never be OOB
        return ROLLENART_TO_ITSLEARNING_ROLE[ROLLENART_ORDER[highestRole]!];
    }
}
