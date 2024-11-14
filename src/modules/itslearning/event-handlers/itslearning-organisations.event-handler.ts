import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ItsLearningConfig } from '../../../shared/config/itslearning.config.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { DomainError } from '../../../shared/error/index.js';
import { KlasseCreatedEvent } from '../../../shared/events/klasse-created.event.js';
import { KlasseDeletedEvent } from '../../../shared/events/klasse-deleted.event.js';
import { KlasseUpdatedEvent } from '../../../shared/events/klasse-updated.event.js';
import { SchuleCreatedEvent } from '../../../shared/events/schule-created.event.js';
import { RootDirectChildrenType } from '../../organisation/domain/organisation.enums.js';
import { CreateGroupParams } from '../actions/create-group.params.js';
import { GroupResponse } from '../actions/read-group.action.js';
import { UpdateGroupParams } from '../actions/update-group.action.js';
import { ItslearningGroupRepo } from '../repo/itslearning-group.repo.js';

@Injectable()
export class ItsLearningOrganisationsEventHandler {
    public ENABLED: boolean;

    public readonly ROOT_OEFFENTLICH: string;

    public constructor(
        private readonly logger: ClassLogger,
        private readonly itslearningGroupRepo: ItslearningGroupRepo,
        configService: ConfigService<ServerConfig>,
    ) {
        const itsLearningConfig: ItsLearningConfig = configService.getOrThrow<ItsLearningConfig>('ITSLEARNING');

        this.ENABLED = itsLearningConfig.ENABLED === 'true';

        this.ROOT_OEFFENTLICH = itsLearningConfig.ROOT_OEFFENTLICH;
    }

    @EventHandler(SchuleCreatedEvent)
    public async createSchuleEventHandler(event: SchuleCreatedEvent): Promise<void> {
        this.logger.info(`Received CreateSchuleEvent, organisationId:${event.organisationId}`);

        if (!this.ENABLED) {
            this.logger.info('Not enabled, ignoring event.');
            return;
        }

        if (event.rootDirectChildrenZuordnung === RootDirectChildrenType.ERSATZ) {
            this.logger.error(`Ersatzschule, ignoring.`);
            return;
        }

        const params: CreateGroupParams = {
            id: event.organisationId,
            name: `${event.kennung} (${event.name ?? 'Unbenannte Schule'})`,
            type: 'School',
            parentId: this.ROOT_OEFFENTLICH,
        };

        {
            // Check if school already exists in itsLearning
            const result: Option<GroupResponse> = await this.itslearningGroupRepo.readGroup(event.organisationId);
            if (result) {
                // School already exists, keep relationship
                params.parentId = result.parentId;
            }
        }

        const createError: Option<DomainError> = await this.itslearningGroupRepo.createOrUpdateGroup(params);

        if (createError) {
            return this.logger.error(`Could not create Schule in itsLearning: ${createError.message}`);
        }

        this.logger.info(`Schule with ID ${event.organisationId} created.`);
    }

    @EventHandler(KlasseCreatedEvent)
    public async createKlasseEventHandler(event: KlasseCreatedEvent): Promise<void> {
        this.logger.info(`Received KlasseCreatedEvent, ID: ${event.id}`);

        if (!this.ENABLED) {
            this.logger.info('Not enabled, ignoring event.');
            return;
        }

        if (!event.administriertVon) {
            return this.logger.error('Klasse has no parent organisation. Aborting.');
        }

        if (!event.name) {
            return this.logger.error('Klasse has no name. Aborting.');
        }

        {
            // Check if parent exists in itsLearning
            const result: Option<GroupResponse> = await this.itslearningGroupRepo.readGroup(event.administriertVon);

            if (!result) {
                // Parent school does not exist
                return this.logger.error(
                    `Parent Organisation (${event.administriertVon}) does not exist in itsLearning.`,
                );
            }
        }

        const params: CreateGroupParams = {
            id: event.id,
            name: event.name,
            type: 'Unspecified',
            parentId: event.administriertVon,
        };

        const createError: Option<DomainError> = await this.itslearningGroupRepo.createOrUpdateGroup(params);

        if (createError) {
            return this.logger.error(`Could not create Klasse in itsLearning: ${createError.message}`);
        }

        this.logger.info(`Klasse with ID ${event.id} created.`);
    }

    @EventHandler(KlasseUpdatedEvent)
    public async updatedKlasseEventHandler(event: KlasseUpdatedEvent): Promise<void> {
        this.logger.info(`Received KlasseUpdatedEvent, ID: ${event.organisationId}, new name: ${event.name}`);

        if (!this.ENABLED) {
            this.logger.info('Not enabled, ignoring event.');
            return;
        }

        if (!event.administriertVon) {
            return this.logger.error('Klasse has no parent organisation. Aborting.');
        }

        if (!event.name) {
            return this.logger.error('Klasse has no name. Aborting.');
        }

        const params: UpdateGroupParams = {
            id: event.organisationId,
            name: event.name,
            type: 'Unspecified',
            parentId: event.administriertVon,
        };

        const createError: Option<DomainError> = await this.itslearningGroupRepo.createOrUpdateGroup(params);

        if (createError) {
            return this.logger.error(`Could not update Klasse in itsLearning: ${createError.message}`);
        }

        this.logger.info(`Klasse with ID ${event.organisationId} was updated.`);
    }

    @EventHandler(KlasseDeletedEvent)
    public async deletedKlasseEventHandler(event: KlasseDeletedEvent): Promise<void> {
        this.logger.info(`Received KlasseUpdatedEvent, ID: ${event.organisationId}`);

        if (!this.ENABLED) {
            this.logger.info('Not enabled, ignoring event.');
            return;
        }

        const deleteError: Option<DomainError> = await this.itslearningGroupRepo.deleteGroup(event.organisationId);

        if (deleteError) {
            return this.logger.error(`Could not delete Klasse in itsLearning: ${deleteError.message}`);
        }

        this.logger.info(`Klasse with ID ${event.organisationId} was deleted.`);
    }
}
