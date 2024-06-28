import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mutex } from 'async-mutex';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ItsLearningConfig, ServerConfig } from '../../../shared/config/index.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';
import { RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { CreatePersonAction } from '../actions/create-person.action.js';
import { ReadPersonAction } from '../actions/read-person.action.js';
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
        private readonly personenRepository: PersonRepository,
        private readonly rolleRepo: RolleRepo,
        private readonly personenkontextRepository: DBiamPersonenkontextRepo,
        configService: ConfigService<ServerConfig>,
    ) {
        const itsLearningConfig: ItsLearningConfig = configService.getOrThrow<ItsLearningConfig>('ITSLEARNING');

        this.ENABLED = itsLearningConfig.ENABLED === 'true';
    }

    @EventHandler(PersonenkontextCreatedEvent)
    public async createPersonenkontextEventHandler(event: PersonenkontextCreatedEvent): Promise<void> {
        this.logger.info(`Received PersonenkontextCreatedEvent, ${event.personId}`);

        if (!this.ENABLED) {
            return this.logger.info('Not enabled, ignoring event.');
        }

        return this.mutex.runExclusive(async () => {
            const personenkontexte: Personenkontext<true>[] = await this.personenkontextRepository.findByPerson(
                event.personId,
            );

            if (personenkontexte.length === 0) {
                // Delete person?
                return this.logger.info(`No Personenkontexte found for Person ${event.personId}.`);
            }

            const targetRole: ItsLearningRoleType = await this.determineItsLearningRole(personenkontexte);

            const personResult = await this.itsLearningService.send(new ReadPersonAction(event.personId));

            if (personResult.ok && personResult.value.institutionRole === targetRole) {
                return this.logger.info('Person already exists with correct role');
            }

            const person: Option<Person<true>> = await this.personenRepository.findById(event.personId);

            if (!person) {
                return this.logger.info(`Person with ID ${event.personId} not found.`);
            }

            if (!person.referrer) {
                return this.logger.error(`Person with ID ${event.personId} has no username!`);
            }

            const createAction: CreatePersonAction = new CreatePersonAction({
                id: event.personId,
                firstName: person.vorname,
                lastName: person.familienname,
                username: person.referrer,
                institutionRoleType: targetRole,
            });

            const createResult: Result<void, DomainError> = await this.itsLearningService.send(createAction);

            if (!createResult.ok) {
                return this.logger.error(`Person with ID ${event.personId} could not be sent to itsLearning!`);
            }

            return this.logger.info(`Person with ID ${event.personId} created in itsLearning!`);
        });
    }

    /**
     * Determines which role the user should have in itsLearning (User needs to have a primary role)
     * @param personenkontexte
     * @returns
     */
    private async determineItsLearningRole(personenkontexte: Personenkontext<true>[]): Promise<ItsLearningRoleType> {
        const rollenIDs: RolleID[] = personenkontexte.map((pk: Personenkontext<true>) => pk.rolleId);
        const rollenMap = await this.rolleRepo.findByIds(rollenIDs);

        let highestRole: number = 0;

        for (const rolle of rollenMap.values()) {
            highestRole = Math.max(highestRole, ROLLENART_ORDER.indexOf(rolle.rollenart));
        }

        // Null assertion is valid here, highestRole can never be OOB
        return ROLLENART_TO_ITSLEARNING_ROLE[ROLLENART_ORDER[highestRole]!];
    }
}
