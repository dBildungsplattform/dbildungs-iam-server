import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EventHandler } from '../../../core/eventbus/decorators/event-handler.decorator.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { ServerConfig } from '../../../shared/config/server.config.js';
import { DomainError } from '../../../shared/error/index.js';
import { OxConfig } from '../../../shared/config/ox.config.js';
import { OxService } from './ox.service.js';
import { CreateUserAction, CreateUserParams } from '../actions/create-user.action.js';
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';

@Injectable()
export class OxEventHandler {
    public ENABLED: boolean;

    public constructor(
        private readonly logger: ClassLogger,
        private readonly oxService: OxService,
        configService: ConfigService<ServerConfig>,
    ) {
        const oxConfig: OxConfig = configService.getOrThrow<OxConfig>('OX');

        this.ENABLED = oxConfig.ENABLED === 'true';
    }

    @EventHandler(PersonenkontextCreatedEvent)
    public async handlePersonenkontextCreatedEvent(event: PersonenkontextCreatedEvent): Promise<void> {
        this.logger.info(
            `Received PersonenkontextCreatedEvent, personId:${event.personId}, organisationId:${event.organisationId}, rolleId:${event.rolleId}`,
        );

        if (!this.ENABLED) {
            this.logger.info('Not enabled, ignoring event.');
            return;
        }

        const params: CreateUserParams = {
            contextId: '',
            anniversary: '',
            email1: '',
            givenname: '',
            mailenabled: true,
            name: '',
            login: '',
            password: '',
        };

        //maybe check if user already exists in OX?

        const action: CreateUserAction = new CreateUserAction(params);

        const result: Result<void, DomainError> = await this.oxService.send(action);

        if (!result.ok) {
            return this.logger.error(`Could not create user in Ox: ${result.error.message}`);
        }

        this.logger.info(`User created in OX`);
    }
}
