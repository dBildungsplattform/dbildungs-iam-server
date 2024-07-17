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
import { RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { CreatePersonAction } from '../actions/create-person.action.js';
import { DeletePersonAction } from '../actions/delete-person.action.js';
import { PersonResponse, ReadPersonAction } from '../actions/read-person.action.js';
import { ItsLearningIMSESService } from '../itslearning.service.js';
import { ItsLearningRoleType } from '../types/role.enum.js';

// Maps our roles to itsLearning roles
const ROLLENART_TO_ITSLEARNING_ROLE: Record<RollenArt, ItsLearningRoleType> = {
    [RollenArt.EXTERN]: ItsLearningRoleType.GUEST,
    [RollenArt.LERN]: ItsLearningRoleType.STUDENT,
    [RollenArt.LEHR]: ItsLearningRoleType.STAFF,
    [RollenArt.LEIT]: ItsLearningRoleType.ADMINISTRATOR,
    [RollenArt.ORGADMIN]: ItsLearningRoleType.ADMINISTRATOR,
    [RollenArt.SYSADMIN]: ItsLearningRoleType.SYSTEM_ADMINISTRATOR,
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
        private readonly rolleRepo: RolleRepo,
        configService: ConfigService<ServerConfig>,
    ) {
        const itsLearningConfig: ItsLearningConfig = configService.getOrThrow<ItsLearningConfig>('ITSLEARNING');

        this.ENABLED = itsLearningConfig.ENABLED === 'true';
    }

    @EventHandler(PersonenkontextUpdatedEvent)
    public async updatePersonenkontexteEventHandler(event: PersonenkontextUpdatedEvent): Promise<void> {
        this.logger.info(`Received PersonenkontextUpdatedEvent, ${event.person.id}`);

        if (!this.ENABLED) {
            return this.logger.info('Not enabled, ignoring event.');
        }

        await this.updatePerson(event.person, event.currentKontexte);
    }

    /**
     * Updates the person based on the current personenkontexte
     */
    public async updatePerson(
        person: PersonenkontextUpdatedPersonData,
        personenkontexte: PersonenkontextUpdatedData[],
    ): Promise<void> {
        // Use mutex because multiple personenkontexte can be created at once
        return this.mutex.runExclusive(async () => {
            // If no personenkontexte exist, delete the person from itsLearning
            if (personenkontexte.length === 0) {
                this.logger.info(`No Personenkontexte found for Person ${person.id}, deleting from itsLearning.`);

                const deleteResult: Result<void, DomainError> = await this.itsLearningService.send(
                    new DeletePersonAction(person.id),
                );

                if (deleteResult.ok) {
                    this.logger.info(`Person deleted.`);
                } else {
                    this.logger.error(`Could not delete person from itsLearning.`);
                }

                return;
            }

            const targetRole: ItsLearningRoleType = await this.determineItsLearningRole(personenkontexte);

            const personResult: Result<PersonResponse, DomainError> = await this.itsLearningService.send(
                new ReadPersonAction(person.id),
            );

            // If user already exists in itsLearning and has the correct role, don't send update
            if (personResult.ok && personResult.value.institutionRole === targetRole) {
                return this.logger.info('Person already exists with correct role');
            }

            if (!person.referrer) {
                return this.logger.error(`Person with ID ${person.id} has no username!`);
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
                return this.logger.error(`Person with ID ${person.id} could not be sent to itsLearning!`);
            }

            return this.logger.info(`Person with ID ${person.id} created in itsLearning!`);
        });
    }

    /**
     * Determines which role the user should have in itsLearning (User needs to have a primary role)
     * @param personenkontexte
     * @returns
     */
    private async determineItsLearningRole(
        personenkontexte: PersonenkontextUpdatedData[],
    ): Promise<ItsLearningRoleType> {
        const rollenIDs: RolleID[] = personenkontexte.map((pk: PersonenkontextUpdatedData) => pk.rolleId);
        const rollenMap: Map<string, Rolle<true>> = await this.rolleRepo.findByIds(rollenIDs);

        let highestRole: number = 0;

        for (const rolle of rollenMap.values()) {
            highestRole = Math.max(highestRole, ROLLENART_ORDER.indexOf(rolle.rollenart));
        }

        // Null assertion is valid here, highestRole can never be OOB
        return ROLLENART_TO_ITSLEARNING_ROLE[ROLLENART_ORDER[highestRole]!];
    }
}
